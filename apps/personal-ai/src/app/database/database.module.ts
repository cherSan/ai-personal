import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {PersonalDocument, PersonalDocumentSchema} from "./personal-document.schema";

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI!),
    MongooseModule.forFeature([
      { name: PersonalDocument.name, schema: PersonalDocumentSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
