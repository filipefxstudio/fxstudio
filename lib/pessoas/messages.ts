export function mensagemDuplicidadeTelefone(nome: string): string {
  return `Já existe um cadastro com este telefone: ${nome}. Selecione o cadastro existente.`;
}

export function mensagemDuplicidadeEmail(nome: string): string {
  return `Já existe um cadastro com este e-mail: ${nome}. Selecione o cadastro existente.`;
}

export function mensagemLeadAtivoOutroCorretor(nomeCorretor: string): string {
  return `Esta pessoa já está em atendimento ativo com ${nomeCorretor}. Solicite a transferência ao gerente.`;
}

export function mensagemLeadAtivoMesmoCorretor(): string {
  return "Esta pessoa já tem um atendimento ativo. Acesse o atendimento existente em vez de criar um novo.";
}

export function mensagemAtendimentoEmAndamento(): string {
  return "Pessoa já cadastrada no sistema com atendimento em andamento.";
}

export function mensagemSelecionarCadastroExistente(): string {
  return "Já existe um cadastro com este contato. Selecione o cadastro existente na lista.";
}

export function mensagemImovelDuplicado(codigo: string, bairro: string): string {
  return `Já existe o imóvel #${codigo} cadastrado neste endereço. Verifique antes de continuar.`;
}

export function mensagemProprietarioIndisponivel(): string {
  return "Esta pessoa já está cadastrada por outro corretor e não está disponível para vinculação.";
}

export function mensagemPessoaDescartada(): string {
  return "Esta pessoa foi descartada anteriormente. Preencha as novas informações de interesse e confirme o novo atendimento.";
}

export function erroDuplicidadePessoa(
  motivo: "telefone" | "email",
  nome: string,
): string {
  return motivo === "telefone"
    ? mensagemDuplicidadeTelefone(nome)
    : mensagemDuplicidadeEmail(nome);
}
