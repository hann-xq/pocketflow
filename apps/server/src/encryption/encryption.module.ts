import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const KEY_BYTES = 32;

/**
 * Validates ENCRYPTION_KEY at application startup so that a misconfigured
 * or absent key is caught immediately rather than on the first database
 * operation that touches an encrypted column.
 */
@Module({})
export class EncryptionModule implements OnModuleInit {
  private readonly logger = new Logger(EncryptionModule.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const raw = this.config.get<string>('ENCRYPTION_KEY');

    if (!raw) {
      throw new Error(
        'ENCRYPTION_KEY is not set. This environment variable is required to encrypt ' +
          'sensitive tokens at rest. Generate a value with: ' +
          "node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
      );
    }

    const key = Buffer.from(raw, 'hex');

    if (key.length !== KEY_BYTES) {
      throw new Error(
        'ENCRYPTION_KEY must be a 64-character hex string (32 bytes).',
      );
    }

    this.logger.log('Encryption key validated successfully.');
  }
}
