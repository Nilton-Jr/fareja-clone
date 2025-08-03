import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ shortId: string }> }
) {
  try {
    const { shortId } = await context.params;

    const promotion = await prisma.promotion.findUnique({
      where: {
        shortId: shortId,
      },
    });

    if (!promotion) {
      return NextResponse.json(
        { error: 'Promoção não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(promotion);
  } catch (error) {
    console.error('Erro ao buscar promoção:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}