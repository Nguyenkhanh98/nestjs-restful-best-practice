import {
  Controller,
  Get,
  Request,
  Post,
  UseGuards,
  Param,
  Res,
  UseInterceptors,
  UploadedFile,
  CacheInterceptor,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiImplicitFile,
  ApiImplicitBody,
  ApiOkResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import * as cloudinary from 'cloudinary';
import { createReadStream } from 'fs';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';
import { LoginUserDto } from './modules/users/loginUser.dto';
import { STATIC, CLOUD_NAME, API_KEY, API_SECRET } from './environments';

@Controller()
@UseInterceptors(CacheInterceptor)
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get(`${STATIC!}/:fileId`)
  getUpload(@Param('fileId') fileId, @Res() res): any {
    return res.sendFile(fileId, {
      root: `${STATIC!}`,
    });
  }

  @UseGuards(AuthGuard('local'))
  @Post('auth/login')
  @ApiImplicitBody({ name: 'user', type: LoginUserDto })
  @ApiOkResponse({ description: 'result Token' })
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiImplicitFile({ name: 'file', required: true })
  async uploadFile(@UploadedFile() file) {
    // console.log(file);

    cloudinary.config({
      cloud_name: CLOUD_NAME!,
      api_key: API_KEY!,
      api_secret: API_SECRET!,
    });

    const uniqueFilename = new Date().toISOString();

    const result = await new Promise(async (resolve, reject) =>
      createReadStream(file)
        .pipe(
          cloudinary.v2.uploader.upload_stream(
            {
              folder: 'chnirt',
              public_id: uniqueFilename,
              tags: `chnirt`,
            }, // directory and tags are optional
            (err, image) => {
              if (err) {
                reject(err);
              }
              resolve(image);
            },
          ),
        )
        .on('close', () => {
          resolve(true);
        })
        .on('error', () => reject(false)),
    );
    return result['secure_url'];
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('uploads')
  @UseInterceptors(FileInterceptor('files'))
  @ApiConsumes('multipart/form-data')
  @ApiImplicitFile({ name: 'files', required: true })
  uploadFiles(@UploadedFile() files) {
    console.log(files);
    return ['path', 'path1'];
  }
}
