import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AxiosResponse } from 'axios';
import { Model } from 'mongoose';
import axiosInstance from 'src/axios/config';
import { Empresa } from 'src/empresa/schemas/schema.empresa';
import * as moment from 'moment-timezone';

@Injectable()
export class EmpresaService {
  constructor(
    @InjectModel(Empresa.name) private readonly empresaModel: Model<Empresa>,
  ) {}

  async verEmpresas(): Promise<Empresa[]> {
    return await this.empresaModel.find().exec();
  }

  async verEmpresaCodigo(codigoempresa: string): Promise<Empresa | undefined> {
    try {
      const respuesta: AxiosResponse<Empresa> = await axiosInstance.get(`/empresas/${codigoempresa}/details`);
      return respuesta.data;
    } catch (error) {
      console.error('Error al obtener la empresa:', error.response?.data || error.message);
      throw new Error('No se pudo obtener la empresa.');
    }
  }

  async getCotizacionesByFechas(
    codigoEmpresa: string,
    fechaDesde: string,
    fechaHasta: string,
  ): Promise<any> {
    try {
      const respuesta: AxiosResponse<any> = await axiosInstance.get(`/empresas/${codigoEmpresa}/cotizaciones`, {
        params: {
          fechaDesde,
          fechaHasta,
        },
      });
      return respuesta.data;
    } catch (error) {
      console.error('Error al obtener cotizaciones:', error.response?.data || error.message);
      throw new Error('No se pudieron obtener las cotizaciones.');
    }
  }

  async getCotizacion(codigoEmpresa: string, fecha: string, hora: string): Promise<any> {
    try {
      const respuesta: AxiosResponse<any> = await axiosInstance.get(`/empresas/${codigoEmpresa}/cotizacion`, {
        params: {
          fecha,
          hora,
        },
      });
      console.log(`Solicitud exitosa: ${codigoEmpresa} ${fecha} ${hora}`);
      return respuesta.data;
    } catch (error) {
      console.error(`Error al obtener la cotización para ${codigoEmpresa} ${fecha} ${hora}:`);
      console.error('Error:', error.response?.data || error.message);
      throw new Error("No se pudo obtener la cotización");
    }
  }
}