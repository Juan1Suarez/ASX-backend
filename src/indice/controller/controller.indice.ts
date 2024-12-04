import { Controller, Post, Body, Get, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { IndiceService } from '../service/service.indice';
import { Indice } from '../schema/schema.indice';
import { CotizacionIndice } from '../schema/schema.cotizacionIndice';

@Controller('indices')
export class IndiceController {
  constructor(private readonly indiceService: IndiceService) { }

  @Get("guardarIndicesDB")
  public async guardarIndices(): Promise<Indice[]> {
    return await this.indiceService.guardarIndices();
  }

  @Get("/porCodigo")
  async verIndices(@Query('code') code?: string) {
    return await this.indiceService.verIndices(code);
  }

  
  @Get()
  async verIndicesCotizaciones() {
    return await this.indiceService.verIndicesCotizaciones();
  }

  @Get('/getIndice/:codigoIndice')
  public async verCotizacionesIndices(
    @Param('codigoIndice') codigoIndice: string,
    @Query('fechaDesde') fechaDesde: string,
    @Query('fechaHasta') fechaHasta: string,
  ): Promise<CotizacionIndice[]> {
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
      return await this.indiceService.CotizacionesIndices(codigoIndice, fechaDesde, fechaHasta);
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'No se pudieron obtener los indices.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('/hacerPromedio')
  async IndiceCotizacionesFiltrar() {
    return await this.indiceService.IndiceCotizacionesFiltrar();
  }


  @Get('/guardarPromedio')
  async IndiceCotizacionesGuardar() {
    const indices = await this.indiceService.IndiceCotizacionesFiltrar();
    const resultado = await this.indiceService.guardarIndicesCotizaciones(indices);
    return resultado;
  }

  @Post()
  async crearIndice(@Body() body: { code: string; name: string },): Promise<void> {
    await this.indiceService.crearIndice(body);
  }

  @Get('/ASX')
  async traerASX(
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
      const indicesASX = await this.indiceService.traerASX('ASX', fechaDesde, fechaHasta);
      return indicesASX;
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Ocurrió un error al obtener las cotizaciones.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/publicarPromedioASX')
  async PublicarPromedioASX(
    @Query('fechaDesde') fechaDesde: string,
    @Query('fechaHasta') fechaHasta: string,
  ) {
    if (!fechaDesde || !fechaHasta) {
      throw new HttpException({
        status: HttpStatus.BAD_REQUEST,
        error: 'Los parámetros fechaDesde y fechaHasta son obligatorios.',
      }, HttpStatus.BAD_REQUEST);
    }

    const indiceASX = await this.indiceService.traerASX("ASX", fechaDesde, fechaHasta);
    await this.publicarPromedioASX(indiceASX);
  }

  private async publicarPromedioASX(indiceASX: CotizacionIndice[]): Promise<void> {
    if (!indiceASX || indiceASX.length === 0) {
      throw new HttpException({
        status: HttpStatus.BAD_REQUEST,
        error: 'No se encontraron datos para publicar.',
      }, HttpStatus.BAD_REQUEST);
    }

    try {
      for (const item of indiceASX) {
        const body = {
          codigoIndice: item.code,
          fecha: item.fecha,
          hora: item.hora,
          fechadate: item.fechaDate,
          valorIndice: item.valor,
        };

        console.log("Enviando cotización:", body);

        await this.indiceService.postIndiceCotizacion(body);
      }
      console.log("Publicación exitosa");
    } catch (error) {
      console.error("Error al publicar el promedio ASX:", error.message);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'No se pudo publicar el promedio ASX. Consulte los logs para más detalles.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

  }

  /*
  @Post('/publicarHardCode')
   async publicarHardCode(): Promise<void> {
    const body = {
      codigoIndice: "ASX",
      fecha: "2024-12-03",
      hora: "09:00",
      fechaDate: "2024-12-02T22:00:00.000Z",
      valorIndice: 162.74,
    }
    await this.indiceService.postIndiceCotizacion(body);
  }*/
}