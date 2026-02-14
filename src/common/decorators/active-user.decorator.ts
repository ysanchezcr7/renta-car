import { ExecutionContext, NotFoundException, createParamDecorator } from '@nestjs/common';

export const ActiveUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest();
	if (!request.user) {
		throw new NotFoundException('User not found in request');
	}
	return request.user;
});
