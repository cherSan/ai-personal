import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  collection: 'git_documents',
  timestamps: true,
})
export class GitDocument extends Document {
  @Prop({ required: true, index: true })
  projectName!: string;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  content!: string;

  @Prop({
    type: [Number],
    required: true,
    validate: {
      validator: (v: number[]) => v.length === 3072,
      message: 'Размерность вектора для gemini-embedding-001 должна быть строго 3072!'
    }
  })
  embedding!: number[];

  @Prop({ type: Object, required: true })
  metadata?: {
    filePath?: string;
    branch?: string;
    chunkHash?: string;
    [key: string]: any;
  };
}

export const GitDocumentSchema = SchemaFactory.createForClass(GitDocument);

GitDocumentSchema.index({ projectName: 1, title: 1, 'metadata.chunkHash': 1 });
