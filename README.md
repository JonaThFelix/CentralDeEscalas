# Central De Escalas
Projeto para entender como funciona as principais escalas de serviços
</br>

Quantas pessoas você precisa para cobrir um posto 24h? E quantas armas?



Essas são perguntas que todo gestor de segurança patrimonial já fez e que raramente têm resposta rápida e visual. Foi esse o problema que me propus a resolver.

Desenvolvi uma central de escalas para vigilância: um site que explica os principais regimes de trabalho (12x36, 44h semanais em 5x2 e 6x1, e revezamento em 3 turnos de 8h) e, principalmente, simula o dimensionamento real de um posto.



O raciocínio por trás do projeto:



→ Cada regime resolve um problema de cobertura diferente. 12x36 exige menos gente para cobrir 24h todos os dias; 44h/5x2 é simples, mas não cobre fim de semana sozinho; 6x1 cobre quase a semana toda com pouco reforço; revezamento em 3 turnos reduz a fadiga, mas exige o maior efetivo.

→ Armamento segue uma lógica própria: a arma pertence ao posto, não à pessoa. Como só um vigilante está de plantão por vez, uma arma bem controlada com termo de transferência e reserva técnica atende a todos os que se revezam ali. Isso muda completamente a conta de quantas armas uma operação precisa.

→ Todo número que o simulador entrega vem com a memória de cálculo aberta. Não adianta cuspir "você precisa de 6 vigilantes" sem mostrar de onde veio esse 6 quem elabora escala de verdade precisa poder auditar a conta e ajustar para a realidade da própria convenção coletiva.



O resultado: você escolhe o número de postos, a cobertura necessária, o regime e se é armado e recebe o efetivo por turno, o total geral, as armas recomendadas e até uma escala de exemplo de 14 dias, tudo com base em CLT, CF/88 e na Lei 7.102/83.



Um projeto pequeno, mas que nasceu de um problema real: transformar uma conta que hoje é feita "no olho" em algo visual, rastreável e fácil de defender numa reunião de contrato.



