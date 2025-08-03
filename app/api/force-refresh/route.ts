import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shortId = searchParams.get('shortId');
    const strategy = searchParams.get('strategy') || '1';
    
    if (!shortId) {
      return new NextResponse('Missing shortId', { status: 400 });
    }

    // Redirecionar para a página do produto com parâmetros específicos para forçar refresh
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 999999);
    
    // Diferentes parâmetros baseados na estratégia
    let redirectParams = '';
    switch(strategy) {
      case '1':
        redirectParams = `?bot=whatsapp&t=${timestamp}&r=${random}`;
        break;
      case '2':
        redirectParams = `?version=2&cache=false&ts=${timestamp}&id=${random}`;
        break;
      case '3':
        redirectParams = `?preview=whatsapp&social=1&refresh=${timestamp}&unique=${random}`;
        break;
      case '4':
        redirectParams = `?source=mobile&platform=android&bust=${timestamp}&rand=${random}`;
        break;
      default:
        redirectParams = `?_=${timestamp}&v=${random}&f=whatsapp`;
        break;
    }
    
    const redirectUrl = `/p/${shortId}${redirectParams}`;
    
    return NextResponse.redirect(new URL(redirectUrl, request.url), 302);
  } catch (error) {
    console.error('Force refresh error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}