import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AxiosResponse } from 'axios';
import { Model } from 'mongoose';
import axiosInstance from 'src/axios/config';
import { Empresa } from 'src/empresa/schemas/schema.empresa';
import { Cotizacion } from '../schemas/schema.cotizacion';

@Injectable()
export class CotizacionesService {
  constructor(
    @InjectModel(Empresa.name) private readonly empresaModel: Model<Empresa>,
    @InjectModel(Cotizacion.name) private readonly cotizacionModel: Model<Cotizacion>,
  ) { }

  async verCotizaciones(): Promise<Cotizacion[]> {
    return await this.cotizacionModel.find().exec();
  }

  async registrarCotizaciones(cotizaciones: any[], codigoEmpresa: string): Promise<any> {
    const empresa = await this.empresaModel.findOne({ codigoempresa: codigoEmpresa }).exec();

    if (!empresa) {
      throw new Error('Empresa no encontrada');
    }

    const cotizacionesGuardadas = [];

    for (const cotizacion of cotizaciones) {
      const nuevaCotizacion = new this.cotizacionModel({
        id: cotizacion.id,
        cotizacion: parseFloat(cotizacion.cotization),
        fecha: cotizacion.fecha,
        hora: cotizacion.hora,
        fechaUTC: cotizacion.dateUTC,
        empresa: empresa.empresa,
      });

      const cotizacionGuardada = await nuevaCotizacion.save();
      cotizacionesGuardadas.push(cotizacionGuardada);
    }

    return cotizacionesGuardadas;
  }
}