import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
@Schema()
export class Indice {

    @Prop({ required: true })
    code: string;

    @Prop({ required: true})
    name: string;

}
export const IndiceSchema = SchemaFactory.createForClass(Indice);