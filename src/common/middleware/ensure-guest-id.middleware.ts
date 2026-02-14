import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class EnsureGuestIdMiddleware implements NestMiddleware {
	use(req: any, res: any, next: Function) {
		if (!req.signedCookies?.guestId) {
			res.cookie('guestId', randomUUID(), {
				httpOnly: true,
				signed: true,
				sameSite: 'lax',
				secure: true, //en prod/https
				maxAge: 1000 * 60 * 60 * 24 * 365,
				path: '/',
			});
		}
		next();
	}
}
