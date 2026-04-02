import { isAxiosError } from 'axios';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExternalServiceException } from '../common/exceptions/external-service.exception';
import { NotAuthorizedException } from '../common/exceptions/not-authorized.exception';
import {
  AbnAmroActivity,
  AbnAmroActivitiesResponse,
} from './dto/abn-amro-activity.dto';
import { AbnAmroConsentInfoResponse } from './dto/abn-amro-consent-info.dto';

/**
 * Thrown when the ABN AMRO API responds with HTTP 401, signalling that the
 * access token is expired or invalid. Used internally to trigger a refresh
 * and retry cycle in AbnAmroService.
 */
export class TokenExpiredError extends Error {}

/**
 * Stateless HTTP client for the ABN AMRO Account Information PSD2 API.
 * Handles request pagination and maps HTTP errors to domain exceptions.
 */
@Injectable()
export class AbnAmroApiClient {
  private readonly logger = new Logger(AbnAmroApiClient.name);

  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    configService: ConfigService,
  ) {
    this.apiUrl = configService.get(
      'ABN_AMRO_API_URL',
      'https://api-sandbox.abnamro.com',
    );
    this.apiKey = configService.get('ABN_AMRO_API_KEY', '');
  }

  async fetchConsentInfo(
    accessToken: string,
  ): Promise<AbnAmroConsentInfoResponse> {
    try {
      const response = await lastValueFrom(
        this.httpService.get<AbnAmroConsentInfoResponse>(
          `${this.apiUrl}/v1/consentinfo`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'API-Key': this.apiKey,
            },
          },
        ),
      );

      return response.data;
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === 401) {
        throw new TokenExpiredError();
      }

      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch consent info: ${msg}`);
      throw new ExternalServiceException(
        'Failed to fetch ABN AMRO consent info.',
      );
    }
  }

  async fetchActivities(
    accessToken: string,
    accountNumber: string,
  ): Promise<AbnAmroActivity[]> {
    const allActivities: AbnAmroActivity[] = [];

    let nextPageKey: string | null = null;

    do {
      const params: Record<string, string> = nextPageKey ? { nextPageKey } : {};

      try {
        const response = await lastValueFrom(
          this.httpService.get<AbnAmroActivitiesResponse>(
            `${this.apiUrl}/v1/accounts/${accountNumber}/activities`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'API-Key': this.apiKey,
              },
              params,
            },
          ),
        );

        const page = response.data.activities.booked;
        allActivities.push(...page);
        nextPageKey = response.data.nextPageKey;

        this.logger.log(
          `Fetched ${page.length} activities (total so far: ${allActivities.length})`,
        );
      } catch (error: unknown) {
        if (isAxiosError(error)) {
          if (error.response?.status === 401) {
            throw new TokenExpiredError();
          }

          if (error.response?.status === 403) {
            throw new NotAuthorizedException(
              'ABN AMRO denied access to this account. Ensure you consented to the correct account.',
            );
          }
        }

        const msg = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`ABN AMRO request error: ${msg}`);
        throw new ExternalServiceException('ABN AMRO request failed.');
      }
    } while (nextPageKey);

    return allActivities;
  }
}
