import { google } from 'googleapis';
import { Readable } from 'stream';
import axios from 'axios';
import { env } from '../config/env';
import { prisma } from '../config/db';

const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
];

export function oauthClient() {
  return new google.auth.OAuth2(
    env.google.clientId,
    env.google.clientSecret,
    env.google.redirect,
  );
}

/** URL that begins the channel-connect OAuth flow. `state` carries the userId. */
export function getAuthUrl(state: string): string {
  return oauthClient().generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state,
  });
}

export async function exchangeCode(code: string) {
  const client = oauthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const yt = google.youtube({ version: 'v3', auth: client });
  const res = await yt.channels.list({ part: ['snippet', 'statistics'], mine: true });
  const ch = res.data.items?.[0];
  if (!ch) throw new Error('No YouTube channel on this Google account');

  return {
    tokens,
    channelId: ch.id!,
    channelName: ch.snippet?.title ?? 'Untitled',
    handle: ch.snippet?.customUrl ?? undefined,
    thumbnailUrl: ch.snippet?.thumbnails?.default?.url ?? undefined,
    subscriberCount: Number(ch.statistics?.subscriberCount ?? 0),
  };
}

async function authedClientFor(channelDbId: string) {
  const channel = await prisma.youtubeChannel.findUnique({
    where: { id: channelDbId },
  });
  if (!channel) throw new Error('Channel not found');
  const client = oauthClient();
  client.setCredentials({
    access_token: channel.accessToken,
    refresh_token: channel.refreshToken,
  });
  // googleapis auto-refreshes; persist any rotated refresh token.
  client.on('tokens', async (t) => {
    await prisma.youtubeChannel.update({
      where: { id: channelDbId },
      data: {
        accessToken: t.access_token ?? channel.accessToken,
        refreshToken: t.refresh_token ?? channel.refreshToken,
        tokenExpiry: t.expiry_date ? new Date(t.expiry_date) : null,
      },
    });
  });
  return client;
}

export async function uploadVideo(opts: {
  channelDbId: string;
  videoUrl: string;
  title: string;
  description: string;
  tags: string[];
  privacyStatus?: 'public' | 'private' | 'unlisted';
  publishAt?: Date;
}): Promise<string> {
  const auth = await authedClientFor(opts.channelDbId);
  const yt = google.youtube({ version: 'v3', auth });

  // Local-fallback media URLs are relative ("/media/..") — resolve them
  // against the internal API so the worker can stream the file.
  const videoSrc = opts.videoUrl.startsWith('http')
    ? opts.videoUrl
    : `${env.internalApiUrl}${opts.videoUrl}`;
  const stream = await axios.get<Readable>(videoSrc, {
    responseType: 'stream',
  });

  const res = await yt.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: opts.title.slice(0, 100),
        description: opts.description,
        tags: opts.tags,
        categoryId: '24', // Entertainment
      },
      status: {
        privacyStatus: opts.publishAt ? 'private' : opts.privacyStatus ?? 'public',
        publishAt: opts.publishAt?.toISOString(),
        selfDeclaredMadeForKids: false,
      },
    },
    media: { body: stream.data },
  });

  return res.data.id!;
}

export async function fetchVideoStats(
  channelDbId: string,
  videoId: string,
): Promise<number> {
  const auth = await authedClientFor(channelDbId);
  const yt = google.youtube({ version: 'v3', auth });
  const res = await yt.videos.list({ part: ['statistics'], id: [videoId] });
  return Number(res.data.items?.[0]?.statistics?.viewCount ?? 0);
}
