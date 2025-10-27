import { Injectable, UploadedFile } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { AppConfigService } from '../app-config/app-config.service';
import { AppSettingKey } from '../app-config/schemas/app-setting.schema';
import * as _ from 'lodash';
import * as path from 'path';
import * as unzipper from 'unzipper';
import * as fs from 'fs';
import { Express } from 'express';
import { Readable } from 'readable-stream';

@Injectable()
export class UploadService {
  constructor(private readonly appConfigService: AppConfigService) {}

  async uploadFile(
    file: Express.Multer.File,
    nameFile: string,
    folder = 'picovoice',
  ) {
    const key = `${folder}/${nameFile}`;
    const config = await this.appConfigService.getByKeyConfig(
      AppSettingKey.AWS,
    );
    const s3 = new S3Client({
      region: _.get(config, 'AWS_REGION'),
      credentials: {
        accessKeyId: _.get(config, 'AWS_ACCESS_KEY_ID'),
        secretAccessKey: _.get(config, 'AWS_SECRET_ACCESS_KEY'),
      },
    });
    const bucketName = _.get(config, 'AWS_S3_BUCKET');
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    });

    await s3.send(command);

    return {
      url: `https://${bucketName}.s3.${_.get(config, 'AWS_REGION')}.amazonaws.com/${key}`,
      key,
    };
  }

  async unzipFile(@UploadedFile() file: Express.Multer.File) {
    const extractPath = path.join(
      process.cwd(),
      'uploads',
      Date.now().toString(),
    );
    fs.mkdirSync(extractPath, { recursive: true });

    // Mở từ buffer (do multer.memoryStorage)
    const directory = await unzipper.Open.buffer(file.buffer);
    // Giải nén tất cả file trong zip
    await Promise.all(
      directory.files.map(async (entry) => {
        if (entry.type === 'File') {
          const fullPath = path.join(extractPath, entry.path);
          fs.mkdirSync(path.dirname(fullPath), { recursive: true });
          const content = await entry.buffer();
          fs.writeFileSync(fullPath, content);
        }
      }),
    );
    return {
      paths: this.findPpnFiles(extractPath),
      dir: extractPath,
    };
  }

  findPpnFiles(dir: string): string[] {
    let results: string[] = [];

    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of list) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        results = results.concat(this.findPpnFiles(fullPath));
      } else if (item.isFile() && fullPath.endsWith('.ppn')) {
        results.push(fullPath);
      }
    }

    return results;
  }

  convertToMulterFile(filePath: string): Express.Multer.File {
    const buffer = fs.readFileSync(filePath);
    const stat = fs.statSync(filePath);

    const multerFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: path.basename(filePath),
      encoding: '7bit',
      mimetype: this.getMimeType(filePath), // có thể dùng mime-types nếu muốn chính xác
      size: stat.size,
      destination: path.dirname(filePath),
      filename: path.basename(filePath),
      path: filePath,
      buffer,
      stream: Readable.from(buffer),
    };
    return multerFile;
  }

  getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.zip':
        return 'application/zip';
      case '.jpg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.ppn':
        return 'application/octet-stream';
      default:
        return 'application/octet-stream';
    }
  }
}
