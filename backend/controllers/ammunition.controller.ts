import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const AmmunitionController = {
  async list(req: Request, res: Response) {
    try {
      const ammunition = await prisma.ammunition.findMany({
        orderBy: { tipo: 'asc' }
      });
      res.json(ammunition);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar munições.' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { tipo, calibre, quantidade } = req.body;

      if (!tipo || !calibre) {
        return res.status(400).json({ error: 'Preencha os campos obrigatórios.' });
      }

      const ammoQuantity = parseInt(quantidade) || 0;

      const ammunition = await prisma.ammunition.create({
        data: {
          tipo,
          calibre,
          quantidade: ammoQuantity
        }
      });

      res.status(201).json(ammunition);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao cadastrar a munição.' });
    }
  }
};