'use client';

import { useEffect } from 'react';
import { Button } from '@/componentes/button';
import { Card, CardHeader, CardBody } from '@/componentes/card';

interface ErrorApiProps {
  erro: string;
  codigo: number;
  mensagem?: string;
  onRetry?: () => void;
}

export function ErrorApi({ erro, codigo, mensagem = 'Ocorreu um erro na API.', onRetry }: ErrorApiProps) {
  useEffect(() => {
    console.error('Erro na API:', erro);
    console.error('Código:', codigo);
    console.error('Mensagem:', mensagem);
  }, [erro, codigo, mensagem]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="text-center">
            <div className="text-6xl mb-4">🔌</div>
            <h1 className="text-2xl font-bold text-gray-800">Erro na API</h1>
            <p className="text-gray-600 mt-2">{mensagem}</p>
            <p className="text-sm text-gray-500 mt-1">Código: {codigo}</p>
          </div>
        </CardHeader>

        <CardBody>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              {erro ? (
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                  {erro}
                </pre>
              ) : (
                'Tente recarregar a página.'
              )}
            </p>

            {onRetry && (
              <Button onClick={onRetry} variant="primary" className="w-full">
                🔄 Tentar novamente
              </Button>
            )}

            <Button
              href="/"
              variant="secondary"
              className="w-full mt-2"
            >
              🏠 Ir para a página inicial
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
"