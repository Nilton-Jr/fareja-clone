// Componente para garantir que as meta tags sejam renderizadas no início do <head>
// Seguindo as melhores práticas para WhatsApp: tags OG nos primeiros 300KB

export default function OptimizedHead() {
  // Este componente deve ser usado no layout.tsx logo após o <head>
  // para garantir que as meta tags sejam renderizadas antes de qualquer CSS
  
  return (
    <>
      {/* Charset e viewport devem vir primeiro */}
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      
      {/* Meta tags críticas para WhatsApp - devem vir ANTES de qualquer CSS */}
      {/* As tags específicas de cada página serão injetadas pelo Next.js aqui */}
      
      {/* Preconnect para otimizar carregamento de recursos */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      
      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
    </>
  );
}