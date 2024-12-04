import { Controller, Get, Param, Query, HttpException, HttpStatus, Post } from '@nestjs/common';
import { EmpresaService } from 'src/empresa/service/service.acciones';
import { Empresa } from 'src/empresa/schemas/schema.empresa';

@Controller('empresas')
export class EmpresaController {

  constructor(private empresaService: EmpresaService) {}


  @Get()
  async verEmpresas() {
    return await this.empresaService.verEmpresas();
  }

  @Get('/:codigoempresa')
  async verEmpresaCodigo(@Param('codigoempresa') codigoempresa: string): Promise<Empresa> {
    try {
      return await this.empresaService.verEmpresaCodigo(codigoempresa);
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: `No se pudo encontrar la empresa con código ${codigoempresa}.`,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Get('/:codigoEmpresa/cotizaciones')
  async getCotizacionesEmpresa(
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
      return await this.empresaService.getCotizacionesByFechas(codigoEmpresa, fechaDesde, fechaHasta);
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'No se pudieron obtener las cotizaciones.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  @Get('/:codigoEmpresa/cotizacion')
  async getCotizacion(
    @Param('codigoEmpresa') codigoEmpresa:string,
    @Query('fecha') fecha: string,
    @Query('hora') hora: string,
  ): Promise<any> {
    if (!fecha || !hora) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Los parámetros fecha y hora son obligatorios.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      return await this.empresaService.getCotizacion(codigoEmpresa, fecha, hora);
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'No se pudo obtener la cotización.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
