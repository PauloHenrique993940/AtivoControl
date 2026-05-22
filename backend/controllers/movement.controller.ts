import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const MovementController = {
  async list(req: Request, res: Response) {
    try {
      const movements = await prisma.movement.findMany({
        include: {
          armament: true,
          responsible: true,
          user: {
            select: { name: true }
          }
        },
        orderBy: { data: 'desc' }
      });
      res.json(movements);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar movimentações.' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      let { tipo, motivo, armamentId, responsibleId, ammunitionId } = req.body;
      const userId = req.userId; // Vem do authMiddleware

      if (!tipo || !userId) {
        return res.status(400).json({ error: 'Dados insuficientes para registrar movimentação.' });
      }

      // Tratamento de IDs vazios que o frontend pode enviar
      const data: any = {
        tipo,
        motivo,
        userId,
        armamentId: armamentId || null,
        responsibleId: responsibleId || null,
        ammunitionId: ammunitionId || null,
      };

      const movement = await prisma.movement.create({
        data
      });

      // Se for uma retirada de armamento, podemos atualizar o status da arma
      const targetArmamentId = data.armamentId;
      if (targetArmamentId && tipo === 'RETIRADA') {
        await prisma.armament.update({
          where: { id: targetArmamentId },
          data: { status: 'USO' }
        });
      } else if (targetArmamentId && tipo === 'DEVOLUCAO') {
        await prisma.armament.update({
          where: { id: targetArmamentId },
          data: { status: 'ESTOQUE' }
        });
      }

      res.status(201).json(movement);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao registrar movimentação.' });
    }
  }
};