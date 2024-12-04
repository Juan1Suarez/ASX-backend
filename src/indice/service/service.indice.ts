import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AxiosResponse } from 'axios';
import { Model } from 'mongoose';
import * as moment from 'moment-timezone';
import axiosInstance from 'src/axios/config';
import { Indice } from '../schema/schema.indice';
import { CotizacionIndice } from '../schema/schema.cotizacionIndice';
import { Cotizacion } from 'src/cotizacion/schemas/schema.cotizacion';

@Injectable()
export class IndiceService {
  constructor(
    @InjectModel(Indice.name) private readonly indiceModel: Model<Indice>,
    @InjectModel(CotizacionIndice.name) private readonly cotizacionIndiceModel: Model<CotizacionIndice>,
    @InjectModel(Cotizacion.name) private readonly cotizacionModel: Model<Cotizacion>,
  ) { }

  async crearIndice(body): Promise<void> {
    try {
      await axiosInstance.post("/indices", body);
    } catch (error) {
      console.error("Error al crear el índice:", error)
    }
  }

  async verIndices(code?: string): Promise<CotizacionIndice[]> {
    const filter = code ? { code } : {};
    return await this.cotizacionIndiceModel.find(filter).exec();
  }

  async verIndicesCotizaciones(): Promise<CotizacionIndice[]> {
    return await this.cotizacionIndiceModel.find().exec();
  }


  async guardarIndices(): Promise<any> {
    const respuesta: AxiosResponse<Indice[]> = await axiosInstance.get("indices");
    const indicesGuardados = [];

    for (const indice of respuesta.data) {
      if (!indice.code || !indice.name) {
        console.error('Faltan datos: ', indice);
        continue;
      }
      const nuevoIndice = new this.indiceModel({
        code: indice.code,
        name: indice.name,
      });

      const indicesGuardado = await nuevoIndice.save();
      indicesGuardados.push(indicesGuardado);
    }

    return indicesGuardados;
  }

  async CotizacionesIndices(
    codigoIndice: string,
    fechaDesde: string,
    fechaHasta: string,
  ): Promise<any> {
    try {
      const respuesta: AxiosResponse<CotizacionIndice[]> = await axiosInstance.get(`/indices/${codigoIndice}/cotizaciones`, {
        params: {
          fechaDesde,
          fechaHasta,
        },
      });
  
      const cotizacionesGuardadas = [];
  
      for (const cotizacion of respuesta.data) {
        const existe = await this.cotizacionIndiceModel.exists({
          code: cotizacion.code,
          fecha: cotizacion.fecha,
          hora: cotizacion.hora,
        });
  
        if (!existe) {
          const nuevaCotizacion = new this.cotizacionIndiceModel({
            code: cotizacion.code,
            fecha: cotizacion.fecha,
            hora: cotizacion.hora,
            fechaDate: cotizacion.fechaDate,
            valor: cotizacion.valor,
          });
  
          const cotizacionGuardada = await nuevaCotizacion.save();
          cotizacionesGuardadas.push(cotizacionGuardada);
          console.log(`Cotización guardada: ${cotizacion.fecha} ${cotizacion.hora}`);
        } else {
          console.log(`Cotización ya existe: ${cotizacion.fecha} ${cotizacion.hora}`);
        }
      }
  
      return cotizacionesGuardadas;
    } catch (error) {
      console.error(
        'Error al obtener o guardar las cotizaciones:',
        error.response?.data || error.message,
      );
      throw new Error('No se pudieron obtener y guardar las cotizaciones.');
    }
  }

  async IndiceCotizacionesFiltrar(): Promise<any> {
    const cotizaciones = await this.cotizacionModel.find().exec();

    const resultado = cotizaciones.reduce<{ [key: string]: { fecha: string, hora: string, suma: number } }>((acc, cotizacion) => {
      const { fecha, hora, cotizacion: valorCotizacion } = cotizacion;

      const clave = `${fecha}-${hora}`;

      if (!acc[clave]) {
        acc[clave] = {
          fecha: fecha,
          hora: hora,
          suma: 0,
        };
      }

      acc[clave].suma += valorCotizacion;

      return acc;
    }, {});

    const resultadoFinal = Object.values(resultado).map(item => {
      const fechaAEST = moment.tz(`${item.fecha}T${item.hora}:00`, 'YYYY-MM-DDTHH:mm:ss', 'Australia/Sydney');
      const fechaDate = fechaAEST.utc();

      return {
        code: "ASX",
        fecha: item.fecha,
        hora: item.hora,
        fechaDate: fechaDate.toISOString(),
        valor: parseFloat((item.suma / 7).toFixed(2)),
      };
    });

    return resultadoFinal;
  }


async IndiceCotizacionesFiltrarCron(cotizaciones: any[]): Promise<any[]> {
  const resultado = cotizaciones.reduce<{ [key: string]: { fecha: string, hora: string, suma: number } }>((acc, cotizacion) => {
    const { fecha, hora, cotizacion: valorCotizacion } = cotizacion;

    const clave = `${fecha}-${hora}`;

    if (!acc[clave]) {
      acc[clave] = {
        fecha: fecha,
        hora: hora,
        suma: 0,
      };
    }

    acc[clave].suma += valorCotizacion;

    return acc;
  }, {});

  const resultadoFinal = Object.values(resultado).map(item => {
    const fechaAEST = moment.tz(`${item.fecha}T${item.hora}:00`, 'YYYY-MM-DDTHH:mm:ss', 'Australia/Sydney');
    const fechaDate = fechaAEST.utc();

    return {
      code: "ASX",
      fecha: item.fecha,
      hora: item.hora,
      fechaDate: fechaDate.toISOString(),
      valor: parseFloat((item.suma / 7).toFixed(2)),
    };
  });

  return resultadoFinal;
}





  async guardarIndicesCotizaciones(indices: CotizacionIndice[]): Promise<any[]> {
    const guardados = [];

    for (const item of indices) {
      const nuevoDocumento = new this.cotizacionIndiceModel({
        code: item.code,
        fecha: item.fecha,
        hora: item.hora,
        fechaDate: item.fechaDate,
        valor: item.valor,
      });

      const guardado = await nuevoDocumento.save();
      guardados.push(guardado);
    }

    return guardados;
  }

  async traerASX(
    code: string,
    fechaDesde: string,
    fechaHasta: string,
  ): Promise<any> {
    try {
      console.log(`Buscando cotizaciones para el código: ${code} desde: ${fechaDesde} hasta: ${fechaHasta}`);
  
      const indices = await this.cotizacionIndiceModel.find({
        code: code,
        fechaDate: {
          $gte: fechaDesde,
          $lte: fechaHasta,
        },
      }).exec();
  
      console.log(`Índices encontrados: ${indices.length}`);
      return indices;
    } catch (error) {
      console.error('Error al obtener cotizaciones:', error.message);
      throw new Error('No se pudieron obtener las cotizaciones.');
    }
  }
  
  

  async postIndiceCotizacion(body: { fecha: string; hora: string; codigoIndice: string; valorIndice: number }): Promise<void> {
    try {
      await axiosInstance.post(`/indices/cotizaciones`, body);
    } catch (error) {
      console.error('Error al enviar los datos:', error);
      throw new Error('No se pudo completar la solicitud al API externo.');
    }
  }
}




  