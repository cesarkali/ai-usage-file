# AI usage file

A Claude Code plugin that saves your Claude plan usage, the 5-hour and the
weekly limit, to a small JSON file on your computer after every response, so
desktop mods, widgets and status bars can show it. It works in the Claude
desktop app, which doesn't run a status line, and in the terminal.

**English** · [Português](#português)

---

## The file

- Windows: `%USERPROFILE%\.ai-usage\claude.json`
- macOS and Linux: `~/.ai-usage/claude.json`

```json
{"rate_limits":{"five_hour":{"used_percentage":42,"resets_at":1767225600},"seven_day":{"used_percentage":10,"resets_at":1767600000}}}
```

- `five_hour` is the 5-hour window and `seven_day` the weekly one.
- `used_percentage` goes from 0 to 100, with at most one decimal.
- `resets_at` is when the window starts over, in Unix seconds.

It is the same `rate_limits` shape Claude Code hands a status line command, so
code that already reads the status line's JSON reads this file too.

The file is written again only when a number changes. Before a chat's first
response, or without a Claude subscription, Claude Code has no limits to give,
and the file keeps the last ones.

## Reading it from a mod or widget

- Read it when it changes (a file watcher, or its modified time). It is under
  1 KB.
- It is written in place: if a read catches it half written and the JSON
  doesn't parse, read it again a moment later.
- Either window can be missing while Claude Code doesn't know it yet.
- Once `resets_at` has passed, that window has started over: show it as 0
  until the file changes.
- The file's modified time says when Claude Code last saw the usage change, not
  that it is live.

### Known readers

- [Mac Island & Dock](https://windhawk.net/mods/mac-island-dock) (Windhawk):
  keeps a copy in its own storage, which this plugin also writes when the mod is
  installed. Turn on its **AI usage** and **Claude Code** options.

## Install

In a Claude Code terminal session:

```
/plugin install ai-usage-file --marketplace cesarkali/ai-usage-file
```

Answer `y` to add the marketplace, then pick the user scope, so it runs in every
chat on this computer.

From a shell:

```
claude plugin install ai-usage-file --marketplace cesarkali/ai-usage-file
```

In the Claude desktop app: click **+** next to the prompt box, then
**Plugins**, **Add marketplace** with `cesarkali/ai-usage-file`, then
**Add plugin**.

It needs Claude Code 2.1.330 or newer (the desktop app already has it; in a
terminal, `claude update`) and a Claude subscription such as Pro or Max: an API
key has no 5-hour or weekly windows.

To remove it:

```
claude plugin uninstall ai-usage-file@ai-usage-file
```

## Privacy

No login, no API key, and nothing goes online: the plugin only reads the usage
Claude Code already has after each response and writes the file. On Windows,
when Mac Island & Dock is installed, it runs `whoami /user` once per session to
name that mod's copy after your account.

## Development

```
claude plugin validate .
claude plugin test .
```

## Feedback

Issues and pull requests are closed here: this repository only holds the
plugin's code. You are welcome to fork it under its license.

## Credits

The file follows the `rate_limits` that Claude Code gives its status line. Not
affiliated with Anthropic; Claude and Claude Code are trademarks of Anthropic.

## License

Code under the [GPL-3.0](LICENSE): you can study, change and share it, as long
as any version you share comes with its full source code, under the same
license and with the credits.

---

## Português

Um plugin do Claude Code que grava o consumo do seu plano do Claude, o limite
de 5 horas e o da semana, num arquivo JSON pequeno no seu computador depois de
cada resposta, para mods, widgets e barras de status mostrarem. Funciona no app
desktop do Claude, que não roda linha de status, e no terminal.

### O arquivo

- Windows: `%USERPROFILE%\.ai-usage\claude.json`
- macOS e Linux: `~/.ai-usage/claude.json`

```json
{"rate_limits":{"five_hour":{"used_percentage":42,"resets_at":1767225600},"seven_day":{"used_percentage":10,"resets_at":1767600000}}}
```

- `five_hour` é a janela de 5 horas e `seven_day` a da semana.
- `used_percentage` vai de 0 a 100, com no máximo uma casa decimal.
- `resets_at` é quando a janela recomeça, em segundos Unix.

É o mesmo formato de `rate_limits` que o Claude Code entrega ao comando da linha
de status, então um código que já lê o JSON da linha de status lê este arquivo
também.

O arquivo só é gravado de novo quando um número muda. Antes da primeira
resposta de um chat, ou sem assinatura do Claude, o Claude Code não tem limites
para dar, e o arquivo fica com os últimos.

### Lendo de um mod ou widget

- Leia quando ele mudar (um observador de arquivo, ou a data de modificação).
  Ele tem menos de 1 KB.
- Ele é gravado por cima: se uma leitura pegar o arquivo no meio da gravação e
  o JSON não abrir, leia de novo logo depois.
- Qualquer uma das janelas pode faltar enquanto o Claude Code ainda não a
  conhece.
- Depois que `resets_at` passa, aquela janela recomeçou: mostre 0 até o arquivo
  mudar.
- A data de modificação diz quando o Claude Code viu o consumo mudar pela
  última vez, não que ele está ao vivo.

#### Quem já lê

- [Mac Island & Dock](https://windhawk.net/mods/mac-island-dock) (Windhawk):
  guarda uma cópia no próprio armazenamento, que este plugin também grava
  quando o mod está instalado. Ligue as opções **AI usage** e **Claude Code**
  dele.

### Instalar

Numa sessão do Claude Code no terminal:

```
/plugin install ai-usage-file --marketplace cesarkali/ai-usage-file
```

Responda `y` para adicionar o marketplace e escolha o escopo do usuário, para
ele rodar em todo chat neste computador.

Pelo shell:

```
claude plugin install ai-usage-file --marketplace cesarkali/ai-usage-file
```

No app desktop do Claude: clique em **+** ao lado da caixa de mensagem, depois
em **Plugins**, **Add marketplace** com `cesarkali/ai-usage-file` e
**Add plugin**.

Precisa do Claude Code 2.1.330 ou mais novo (o app desktop já vem com ele; no
terminal, `claude update`) e de uma assinatura do Claude, como Pro ou Max: uma
chave de API não tem as janelas de 5 horas e da semana.

Para remover:

```
claude plugin uninstall ai-usage-file@ai-usage-file
```

### Privacidade

Sem login, sem chave de API e nada vai para a internet: o plugin só lê o
consumo que o Claude Code já tem depois de cada resposta e grava o arquivo. No
Windows, com o Mac Island & Dock instalado, ele roda `whoami /user` uma vez por
sessão para dar à cópia desse mod o nome da sua conta.

### Desenvolvimento

```
claude plugin validate .
claude plugin test .
```

### Sugestões

Issues e pull requests estão fechados aqui: este repositório só guarda o código
do plugin. Fique à vontade para fazer um fork sob a licença.

### Créditos

O arquivo segue os `rate_limits` que o Claude Code entrega à linha de status.
Sem ligação com a Anthropic; Claude e Claude Code são marcas da Anthropic.

### Licença

Código sob a licença [GPL-3.0](LICENSE): você pode estudar, modificar e
redistribuir, desde que qualquer versão distribuída vá junto com o código-fonte
completo, sob a mesma licença e com os créditos.
