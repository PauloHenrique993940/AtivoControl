import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const ArmamentController = {
  // Listar todas as armas
  async list(req: Request, res: Response) {
    try {
      const armaments = await prisma.armament.findMany({
        orderBy: { createdAt: 'desc' }
      });
      res.json(armaments);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar armamentos.' });
    }
  },

  // Criar uma nova arma
  async create(req: Request, res: Response) {
    try {
      const { tipo, marca, modelo, calibre, numSerie, numRegistro, dataAquisicao, local, status } = req.body;

      // Validação básica
      if (!tipo || !marca || !modelo || !calibre || !numSerie || !numRegistro) {
        return res.status(400).json({ error: 'Preencha os campos obrigatórios.' });
      }

      const armament = await prisma.armament.create({
        data: {
          tipo,
          marca,
          modelo,
          calibre,
          numSerie,
          numRegistro,
          dataAquisicao: dataAquisicao ? new Date(dataAquisicao) : new Date(),
          local: local || 'Armaria Central',
          status: status || 'ESTOQUE'
        }
      });

      res.status(201).json(armament);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao cadastrar o armamento.' });
    }
  },

  // Atualizar arma existente
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (typeof id !== 'string') return res.status(400).json({ error: 'ID inválido' });
      const { tipo, marca, modelo, calibre, numSerie, numRegistro, status } = req.body;

      const armament = await prisma.armament.update({
        where: { id },
        data: { tipo, marca, modelo, calibre, numSerie, numRegistro, status }
      });

      res.json(armament);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar o armamento.' });
    }
  },

  // Excluir arma
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (typeof id !== 'string') return res.status(400).json({ error: 'ID inválido' });
      await prisma.armament.delete({ where: { id } });
      res.json({ message: 'Armamento removido com sucesso.' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao excluir o armamento.' });
    }
  }
};
