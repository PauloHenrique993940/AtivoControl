import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const ResponsibleController = {
  async list(req: Request, res: Response) {
    try {
      const responsibles = await prisma.responsible.findMany({
        orderBy: { nome: 'asc' }
      });
      res.json(responsibles);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar responsáveis.' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { nome, identificacaoFuncional, setor } = req.body;

      if (!nome || !identificacaoFuncional || !setor) {
        return res.status(400).json({ error: 'Preencha os campos obrigatórios.' });
      }

      const responsible = await prisma.responsible.create({
        data: {
          nome,
          identificacaoFuncional,
          setor
        }
      });

      res.status(201).json(responsible);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao cadastrar o responsável.' });
    }
  }
};