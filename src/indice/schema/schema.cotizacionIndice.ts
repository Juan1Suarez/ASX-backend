import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
@Schema()
export class CotizacionIndice {

    @Prop({ required: true })
    code: string;

    @Prop({ required: true })
    fecha: string;

    @Prop({ required: true })
    hora: string;
    
    @Prop({ required: true })
    fechaDate: string;

    @Prop({ required: true })
    valor: number;

}
export const CotizacionIndiceSchema = SchemaFactory.createForClass(CotizacionIndice);
