import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as moment from 'moment-timezone';
import { Model } from 'mongoose';
import { Cotizacion } from 'src/cotizacion/schemas/schema.cotizacion';
import { EmpresaService } from 'src/empresa/service/service.acciones';
import { CotizacionIndice } from 'src/indice/schema/schema.cotizacionIndice';
import { Indice } from 'src/indice/schema/schema.indice';
import { IndiceService } from 'src/indice/service/service.indice';

@Injectable()
export class GempresaCronService {
  private readonly logger = new Logger(GempresaCronService.name);
  constructor(
    private empresaService: EmpresaService,
    private indiceService: IndiceService,
    @InjectModel(Cotizacion.name) private readonly cotizacionModel: Model<Cotizacion>,
    @InjectModel(CotizacionIndice.name) private readonly cotizacionIndiceModel: Model<CotizacionIndice>,
    @InjectModel(Indice.name) private readonly indiceModel: Model<Indice>,
  ) { }

  @Cron('10 0 * * * *')
  async obtenerUltimaCotizacion() {
    try {
      const fechaActual = new Date();
      const fecha = fechaActual.toISOString().split('T')[0];
      const horaUTC = fechaActual.getUTCHours().toString().padStart(2, '0');
      const minutosUTC = '00';
  
      const hora = `${horaUTC}:${minutosUTC}`;
  
      const empresas = await this.empresaService.verEmpresas();
      const cotizacionesGuardadas = [];
  
      for (const empresa of empresas) {
        const codigoEmpresa = empresa.codigoempresa;
        const nombreEmpresa = empresa.empresa; 
        const cotizacion = await this.empresaService.getCotizacion(codigoEmpresa, fecha, hora);
        if (cotizacion) {
          const fechaAEST = moment.tz(`${cotizacion.fecha}T${cotizacion.hora}:00`, 'YYYY-MM-DDTHH:mm:ss', 'UTC').tz('Australia/Sydney');
          const horaAEST = fechaAEST.hours();
  
          if (horaAEST >= 9 && horaAEST <= 15) {
            const nuevaCotizacion = new this.cotizacionModel({
              id: cotizacion.id,
              cotizacion: parseFloat(cotizacion.cotization),
              fecha: fechaAEST.format('YYYY-MM-DD'),
              hora: `${horaAEST.toString().padStart(2, '0')}:00`,
              fechaUTC: cotizacion.dateUTC,
              empresa: nombreEmpresa,
            });
            await nuevaCotizacion.save();
            cotizacionesGuardadas.push(nuevaCotizacion);
          }
        } else {
          console.log("No se pudo obtener la cotización para", codigoEmpresa + fecha + hora);
        }
      }
  
      console.log("Cotizaciones guardadas:", cotizacionesGuardadas);
  
      const resultadoFiltrado = await this.indiceService.IndiceCotizacionesFiltrarCron(cotizacionesGuardadas);
      console.log("Resultado Filtrado:", resultadoFiltrado);
      for (const item of resultadoFiltrado) {
        const nuevaCotizacionIndice = new this.cotizacionIndiceModel(item);
        await nuevaCotizacionIndice.save();
      }
    } catch (error) {
      console.error('Error al obtener la última cotización:', error.message);
    }
  }
  

  @Cron('1 0 * * * *') 
  async obtenerIndicesActualizados() {
    try {
      const fechaActual = new Date();

      const fechaDesde = new Date(fechaActual);
      fechaDesde.setDate(fechaActual.getDate() - 7);
      const fechaDesdeStr = fechaDesde.toISOString().slice(0, 16);
      const fechaHastaStr = fechaActual.toISOString().slice(0, 16);

      console.log(`Solicitando cotizaciones de índices desde ${fechaDesdeStr} hasta ${fechaHastaStr}`);

      const indices = await this.indiceModel.find().exec();

      for (const indice of indices) {
        const { code, name } = indice;
        try {
          console.log(`Procesando índice: ${name} (${code})`);

          const cotizaciones = await this.indiceService.CotizacionesIndices(code, fechaDesdeStr, fechaHastaStr);

          if (cotizaciones && cotizaciones.length > 0) {
            console.log(`Cotizaciones obtenidas para ${name} (${code}):`, cotizaciones.length);
          } else {
            console.log(`No se encontraron cotizaciones nuevas para ${name} (${code}).`);
          }
        } catch (error) {
          console.error(`Error al obtener cotizaciones para ${name} (${code}):`, error.message);
        }
      }

      console.log('Actualización de índices completada.');
    } catch (error) {
      console.error('Error general al ejecutar el cron de índices:', error.message);
    }
  }


  @Cron('30 0 * * * *')
  async publicarIndices() {
    try {
      const fechaActualUTC = new Date(); 
      const fechaAustralia = moment(fechaActualUTC).tz('Australia/Sydney');
  
      const fecha = fechaAustralia.format('YYYY-MM-DD');
      const hora = fechaAustralia.format('HH:00');
  
      console.log("Hora Australia:", fecha, hora);

      const indices = await this.cotizacionIndiceModel.find({
        fecha: fecha,
        hora: hora
      }).exec();

      console.log("Indices encontrados:", indices);
      for (const indice of indices) {
        const body = {
          fecha: indice.fecha,
          hora: indice.hora,
          codigoIndice: indice.code,
          valorIndice: indice.valor,
        };
        await this.indiceService.postIndiceCotizacion(body);
      }
  
      console.log("Indices publicados:", indices);
  
    } catch (error) {
      console.error('Error al publicar los índices:', error.message);
    }
  }
  
}