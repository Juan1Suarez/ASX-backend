import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Empresa, EmpresaSchema } from './empresa/schemas/schema.empresa';
import { EmpresaController } from './empresa/controller/controller.acciones';
import { EmpresaService } from './empresa/service/service.acciones';
import { ScheduleModule } from '@nestjs/schedule';
import { GempresaCronService } from './gempresa-cron/gempresa-cron.service';
import { CotizacionesController } from './cotizacion/controller/controller.cotizacion';
import { CotizacionesService } from './cotizacion/service/service.cotizacion';
import { Cotizacion, CotizacionSchema } from './cotizacion/schemas/schema.cotizacion';
import { IndiceController } from './indice/controller/controller.indice';
import { IndiceService } from './indice/service/service.indice';
import { Indice, IndiceSchema } from './indice/schema/schema.indice';
import { CotizacionIndice, CotizacionIndiceSchema } from './indice/schema/schema.cotizacionIndice';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forRoot('mongodb://localhost:27017/ASX'),
    MongooseModule.forFeature([
      {
        name: Empresa.name,
        schema: EmpresaSchema,
      },
      { 
        name: Cotizacion.name,
         schema: CotizacionSchema 
        },
        {
          name: Indice.name,
          schema: IndiceSchema,
        },
        {
          name: CotizacionIndice.name,
          schema: CotizacionIndiceSchema,
        },
    ]),
  ],
  controllers: [ AppController, EmpresaController, CotizacionesController, IndiceController ],
  providers: [ AppService, EmpresaService, GempresaCronService, CotizacionesService, IndiceService ],
})
export class AppModule {}