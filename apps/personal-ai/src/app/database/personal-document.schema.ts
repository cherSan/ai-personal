import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  collection: 'personal_documents',
  timestamps: true,
})
export class PersonalDocument extends Document {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  content!: string;

  @Prop({ type: [Number], required: true })
  embedding!: number[];

  @Prop({ type: Object, required: true })
  metadata?: {
    section?: string;
    [key: string]: any;
  };
}

export const PersonalDocumentSchema = SchemaFactory.createForClass(PersonalDocument);
