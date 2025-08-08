import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class HeaderGuard implements CanActivate {
  private readonly requiredHeaders = ['uid-device', 'lang', 'app-version'];

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    const missingHeaders = this.requiredHeaders.filter(
      (header) => !request.headers[header.toLowerCase()],
    );

    if (missingHeaders.length > 0) {
      throw new HttpException(
        `Missing required headers: ${missingHeaders.join(', ')}`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    return true;
  }
}
