# BPM Metronome App - Versão Desktop

Este é um aplicativo desktop que funciona offline, baseado no BPM Metronome App web.

## 🚀 Como Usar

### Para Usuários Finais (Sem Conhecimento Técnico)

1. **Baixe o arquivo executável** (`.exe` no Windows)
2. **Execute o arquivo** - o aplicativo abrirá automaticamente
3. **Use normalmente** - todas as funcionalidades estão disponíveis

### Para Desenvolvedores (Criar o Executável)

#### Pré-requisitos
- Node.js instalado (https://nodejs.org/)
- Windows, macOS ou Linux

#### Passos

1. **Instalar dependências:**
   ```bash
   # Windows
   install.bat
   
   # Ou manualmente
   npm install
   ```

2. **Testar o aplicativo:**
   ```bash
   npm start
   ```

3. **Criar executável:**
   ```bash
   # Windows
   build.bat
   
   # Ou manualmente
   npm run build-win    # Windows
   npm run build-mac    # macOS
   npm run build-linux  # Linux
   ```

4. **Distribuir:**
   - O executável estará na pasta `dist/`
   - Envie apenas o arquivo `.exe` (Windows) para os usuários

## 🎵 Funcionalidades

- ✅ **Calculadora de BPM** com função TAP
- ✅ **Metronome** com diferentes sons
- ✅ **Pads ambientais** (C, C#, D, etc.)
- ✅ **Repertórios** para organizar músicas
- ✅ **Importar/Exportar** repertórios
- ✅ **Controles por teclado**
- ✅ **Funciona offline**

## ⌨️ Atalhos de Teclado

- **Espaço**: Play/Pause Metronome
- **Ctrl+Espaço**: Play All
- **T**: Tap BPM
- **R**: Reset BPM
- **Ctrl+N**: Novo Repertório
- **Ctrl+M**: Adicionar Música
- **Ctrl+→**: Próximo Preset
- **Ctrl+←**: Preset Anterior

## 📁 Estrutura do Projeto

```
bpm-metronome-app/
├── index.html          # Interface principal
├── app-v4.js          # Lógica da aplicação
├── styles-v4.css      # Estilos
├── main.js            # Ponto de entrada do Electron
├── package.json       # Configurações e dependências
├── build.bat          # Script de build (Windows)
├── install.bat        # Script de instalação (Windows)
├── ambiences/         # Sons dos pads
├── metronomes/        # Sons do metronome
└── dist/              # Executáveis gerados
```

## 🔧 Solução de Problemas

### Erro: "npm não é reconhecido"
- Instale o Node.js: https://nodejs.org/
- Reinicie o terminal/prompt

### Erro: "Failed to install dependencies"
- Verifique sua conexão com a internet
- Execute como administrador (Windows)

### Aplicativo não abre
- Verifique se o arquivo não está corrompido
- Execute como administrador (Windows)
- Verifique o antivírus (pode bloquear)

## 📞 Suporte

Se encontrar problemas:
1. Verifique se seguiu todos os passos
2. Teste com `npm start` antes de criar o executável
3. Verifique os logs de erro no console

## 🎯 Vantagens da Versão Desktop

- ✅ **Funciona offline** - não precisa de internet
- ✅ **Mais rápido** - sem dependência de servidor
- ✅ **Controles nativos** - menu, atalhos, etc.
- ✅ **Fácil distribuição** - um arquivo executável
- ✅ **Sem instalação** - executa diretamente
- ✅ **Dados locais** - repertórios salvos no computador
