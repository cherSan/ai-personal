import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {PersonalDocument, PersonalDocumentSchema} from "./personal-document.schema";
import {GitDocument, GitDocumentSchema} from "./git-document.schema";

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI!),
    MongooseModule.forFeature([
      { name: PersonalDocument.name, schema: PersonalDocumentSchema },
      { name: GitDocument.name, schema: GitDocumentSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
