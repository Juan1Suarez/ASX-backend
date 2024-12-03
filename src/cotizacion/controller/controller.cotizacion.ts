import { Controller, Get, Param, Query, HttpException, HttpStatus, Post } from '@nestjs/common';
import { CotizacionesService } from '../service/service.cotizacion';
import { EmpresaService } from 'src/empresa/service/service.acciones';
import * as moment from 'moment-timezone';

@Controller('cotizaciones')
export class CotizacionesController {
  cotizacionModel: any;

  constructor(
    private cotizacionesService: CotizacionesService,
    private empresaService: EmpresaService,
  ) {}


  @Get()
  async verCotizaciones() {
    return await this.cotizacionesService.verCotizaciones();
  }
  

  @Post('/:codigoEmpresa/cotizaciones/traer')
  async traerCotizaciones(
   @Param('codigoEmpresa') codigoEmpresa: string,
   @Query('fechaDesde') fechaDesde: string,
   @Query('fechaHasta') fechaHasta: string,
 ): Promise<any> {
   if (!fechaDesde || !fechaHasta) {
     throw new HttpException(
       {
         status: HttpStatus.BAD_REQUEST,
         error: 'Los parámetros fechaDesde y fechaHasta son obligatorios.',
       },
       HttpStatus.BAD_REQUEST,
     );
   }
 
   try {
     const cotizaciones = await this.empresaService.getCotizacionesByFechas(codigoEmpresa, fechaDesde, fechaHasta);
 
     const cotizacionesFiltradas = cotizaciones.filter(cotizacion => {
       const fechaAEST = moment.tz(`${cotizacion.fecha}T${cotizacion.hora}:00`, 'YYYY-MM-DDTHH:mm:ss', 'UTC').tz('Australia/Sydney');
       const horaAEST = fechaAEST.hours();
       return horaAEST >= 9 && horaAEST <= 15;
     });
 
     const cotizacionesAjustadas = cotizacionesFiltradas.map(cotizacion => {
       const fechaAEST = moment.tz(`${cotizacion.fecha}T${cotizacion.hora}:00`, 'YYYY-MM-DDTHH:mm:ss', 'UTC').tz('Australia/Sydney');
       const horaAEST = fechaAEST.hours();
       
       return {
         ...cotizacion,
         fecha: fechaAEST.format('YYYY-MM-DD'),
         hora: `${horaAEST.toString().padStart(2, '0')}:00`
       };
     });
 
     const cotizacionesRegistradas = await this.cotizacionesService.registrarCotizaciones(cotizacionesAjustadas, codigoEmpresa);
 
     console.log('Cotizaciones obtenidas, filtradas y registradas:', cotizacionesRegistradas);
 
     return {
       message: 'Cotizaciones obtenidas, filtradas y registradas exitosamente.',
       cotizaciones: cotizacionesRegistradas,
     };
   } catch (error) {
     console.error('Error al obtener, filtrar o registrar cotizaciones:', error);
     throw new HttpException(
       {
         status: HttpStatus.INTERNAL_SERVER_ERROR,
         error: 'No se pudieron obtener o registrar las cotizaciones.',
       },
       HttpStatus.INTERNAL_SERVER_ERROR,
     );
   }
 } 
}
