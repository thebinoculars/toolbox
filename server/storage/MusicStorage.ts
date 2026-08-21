import { GetObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import {
  getFilebaseAccessKeyId,
  getFilebaseMusicBucket,
  getFilebaseSecretAccessKey,
} from '../../shared/utils'

const FILEBASE_MUSIC_BUCKET = getFilebaseMusicBucket()

const s3 = new S3Client({
  endpoint: 'https://s3.filebase.io',
  region: 'auto',
  credentials: {
    accessKeyId: getFilebaseAccessKeyId(),
    secretAccessKey: getFilebaseSecretAccessKey(),
  },
})

export const listPlaylists = async (): Promise<(string | undefined)[]> => {
  const command = new ListObjectsV2Command({
    Bucket: FILEBASE_MUSIC_BUCKET,
    Delimiter: '/',
  })
  const result = await s3.send(command)

  return result.CommonPrefixes?.map((prefix) => prefix.Prefix?.replace('/', '')) || []
}

export const getSongsInPlaylist = async (id: string): Promise<(string | undefined)[]> => {
  const command = new ListObjectsV2Command({
    Bucket: FILEBASE_MUSIC_BUCKET,
    Prefix: `${id}/`,
  })
  const result = await s3.send(command)

  return (
    result.Contents?.map((object) => object.Key)
      .filter((key) => key?.toLowerCase().endsWith('.mp3'))
      .map((prefix) => prefix?.split('/').pop()?.replace('.mp3', '')) || []
  )
}

export const getSongUrl = async (fileId: string): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: FILEBASE_MUSIC_BUCKET,
    Key: decodeURIComponent(fileId),
  })
  return getSignedUrl(s3, command, { expiresIn: 60 * 5 })
}
