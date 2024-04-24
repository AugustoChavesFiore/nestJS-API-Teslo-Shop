import { ExecutionContext, InternalServerErrorException, createParamDecorator } from "@nestjs/common";

export const RawHeaders = createParamDecorator((data, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const rawHeaders = request.rawHeaders;
    if (data) {
        return rawHeaders?.[data];
    }
    if (!rawHeaders) throw new InternalServerErrorException('Row header not found in request object');
    
    return rawHeaders;
    });