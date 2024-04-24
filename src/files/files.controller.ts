import { Controller, Get, Post, Param, UploadedFile, UseInterceptors, BadRequestException, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { fileNamer,fileFilter } from './helpers';
import { Response } from 'express';

@ApiTags("Files")
@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly configService: ConfigService,
  ) {}


  @Get('product/:imageName')
  findProductImage(
    @Res() res:Response,
    @Param('imageName') imageName: string,
  ){
    const path = this.filesService.getStaticProductImage(imageName);
    return res.sendFile(path);
  }



  @Post('product')
  @UseInterceptors(FileInterceptor('file',{
    fileFilter: fileFilter,
    limits:{fieldNameSize:1500},
    storage: diskStorage({
      destination:'./static/products',
      filename:fileNamer,
    }),
  }))
  uploadProductImage( @UploadedFile() file: Express.Multer.File,){
    if(!file) throw new BadRequestException('Make sure that the file is an image ')
    const url = `${this.configService.get('HOST_API')}/files/product/${file.filename}`;
    return url;
  };
 
};

