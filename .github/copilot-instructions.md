# n8n Workflows - AI Assistant Instructions

## Project Overview
This repository contains Hassan's personal n8n workflow automation for intelligent email and calendar management. The main workflow creates an AI-powered assistant that automatically processes Gmail, classifies emails, manages Google Calendar events, and provides conversational interaction via Telegram.

## Core Workflow Architecture

### Main Workflow: `Automate Email & Calendar Management with Gmail, Google Calendar & GPT-4o AI.json`
This is the primary automation with multiple operational modes:

1. **Email Processing Pipeline**: `Gmail Trigger → Email Classification → Label Assignment + Vector Storage`
2. **Chat Interface**: `Chat/Telegram Trigger → Session Management → AI Agent → Response`
3. **Calendar Integration**: AI agent can read/create calendar events via Google Calendar API
4. **Voice Support**: Telegram voice messages → Transcription → AI processing

### Supporting Files
- **`workflow2.json`**: Simplified test version with core email processing
- **`node.json`**: Reusable LangChain components for vector storage and retrieval
- **`chrome_remote_debug.js`**: Debug utility for Chrome remote debugging

### Multi-Trigger System
- **`gmailTrigger`**: Automatic email processing (polls every minute)
- **`chatTrigger`**: Web-based chat interface
- **`telegramTrigger`**: Telegram bot integration with voice support
- **`manualTrigger`**: Manual testing and development
- **`executeWorkflowTrigger`**: Inter-workflow communication

## Development Conventions

### Node Configuration
- All nodes have unique IDs (UUID format) and descriptive names
- Use `typeVersion` for compatibility (typically 1.1-2.1)
- Credentials reference external accounts via `{"id": "...", "name": "..."}`
- Position coordinates organize visual workflow layout (e.g., `[1620, 1730]`)

### AI Agent Architecture
- **Central Agent**: `EMail Agent` node (`@n8n/n8n-nodes-langchain.agent`) with comprehensive system prompt
- **Memory Management**: `Window Buffer Memory` with `sessionIdType: "customKey"` and `contextWindowLength: 10`
- **Session Handling**: `sessionId-master` noOp node manages session state across triggers
- **Tool Integration**: AI tools connected via `ai_tool` connection type to main agent

### Model Selection & Configuration
- **Primary Model**: OpenAI `o3` model for main agent reasoning
- **Classification**: Separate OpenAI model for email classification
- **Anthropic Support**: Claude models available with `thinking: true` option
- **Embeddings**: `embeddingsOpenAi` for vector generation

### Tool Configuration Patterns
- Gmail tools use `descriptionType: "manual"` with detailed `toolDescription`
- Calendar tools require timezone-aware formats: `"2017-07-01T13:00:00+02:00"`
- AI parameter extraction: `$fromAI('param_name', 'description', 'type')`
- Vector store tools need descriptive prompts for retrieval context

### Expression Syntax & Data Flow
- Standard data access: `={{ $json.field }}`
- Cross-node references: `$('sessionId-master').item.json.sessionId`
- AI-generated parameters: `$fromAI('Message_ID', '', 'string')`
- Current time: `$now` for timezone-aware operations

## Workflow Debugging

### Common Issues
- **Credential Errors**: Check `credentials` object references match configured accounts
- **Node Connections**: Verify connection types (`main`, `ai_tool`, `ai_languageModel`, `ai_embedding`)
- **Expression Errors**: Validate expression syntax and data availability

### Testing Patterns
- Use `manualTrigger` ("When clicking 'Test workflow'") for development
- `noOp` nodes for data passing and debugging
- `stickyNote` nodes for workflow documentation

## File Naming & Structure
- Workflow files use descriptive names with `.json` extension
- Node configurations can be extracted to separate files for reusability
- Debug scripts (like `chrome_remote_debug.js`) use standard JavaScript

## Integration Points
- **Gmail API**: Requires OAuth2 credentials for email operations
- **Google Calendar API**: Needs separate OAuth2 for calendar access
- **OpenAI API**: Requires API key for LLM and embedding operations
- **Telegram Bot**: Uses bot token for chat interface
- **PostgreSQL**: Optional for persistent vector storage

## Email Classification System
The workflow uses a `textClassifier` node with specific categories:
- **Personal Categories**: `Khadija` (khadija0308@hotmail.com)
- **Legal Categories**: `Custody Case` (Frodis Family Law emails)
- **Fallback**: `other` for unclassified emails

### Label Assignment
Classification triggers automatic Gmail label assignment:
- `Gmail - Label as Important` for priority emails
- `Gmail label as Custody Case` for legal correspondence
- Label IDs must match existing Gmail labels

## Vector Storage & Embedding Architecture

### Core Components & Data Flow
The workflow uses a sophisticated vector storage system for email context retrieval:

```
Gmail Thread → Code Summarization → Default Data Loader → Token Splitter → Vector Store
                                                                      ↓
Embeddings OpenAI → Vector Store (PostgreSQL/In-Memory) → Vector Store Tool → AI Agent
```

### Embedding Nodes
- **`Embeddings OpenAI`** (`@n8n/n8n-nodes-langchain.embeddingsOpenAi`)
  - **Position**: `[1380, 430]`
  - **Input Schema**: Receives text data from `Default Data Loader` via `ai_document` connection
  - **Parameters**: `{"options": {}}` - uses default OpenAI embedding model
  - **Credentials**: `"openAiApi": {"id": "JSPFLNImx8SGH5aT", "name": "OpenAi account"}`
  - **Output**: Connects to two vector stores via `ai_embedding` connections

- **`Embeddings OpenAI1`** (`@n8n/n8n-nodes-langchain.embeddingsOpenAi`)
  - **Position**: `[2280, 2350]`
  - **Input Schema**: Dedicated for PostgreSQL vector store operations
  - **Parameters**: Same as above, separate instance for production storage
  - **Output**: Connects to `Postgres PGVector Store1` via `ai_embedding`

### Vector Store Nodes

#### In-Memory Vector Stores (Development/Testing)
- **`Write - Threads History Vector Store`** (`vectorStoreInMemory`)
  - **Mode**: `"insert"` with `"clearStore": true`
  - **Input**: From `Embeddings OpenAI` via `ai_embedding`
  - **Status**: `"disabled": true` (inactive in production)

- **`Read- Threads History Vector Store`** (`vectorStoreInMemory`)
  - **Mode**: `"load"` with `"prompt": "workshop"` and `"topK": 100`
  - **Parameters**: Retrieves up to 100 most relevant vectors
  - **Status**: Active for development testing

- **`Threads History Vector Store`** (`vectorStoreInMemory`)
  - **Position**: `[2200, 2152.5]`
  - **Status**: `"disabled": true` (backup/alternative storage)

#### PostgreSQL Vector Store (Production)
- **`Postgres PGVector Store1`** (`vectorStorePGVector`)
  - **Mode**: `"load"` from `"tableName": "email_vectors"`
  - **Input**: From `Embeddings OpenAI1` via `ai_embedding`
  - **Credentials**: `"postgres": {"id": "eLpMSSYyxKkA5aJO", "name": "Postgres account 2"}`
  - **Output**: Connects to `Research context and infos in previous conversations` via `ai_vectorStore`

- **`Write - Threads History Vector Store2`** (`vectorStorePGVector`)
  - **Mode**: `"insert"` to `"tableName": "email_vectors"`
  - **Parameters**: `"columnNames": {"values": {"contentColumnName": "content"}}`
  - **Input**: From `Default Data Loader` via `ai_document` and `Embeddings OpenAI` via `ai_embedding`
  - **Function**: Persists email summaries as vectors in PostgreSQL

### Document Processing Pipeline
- **`Default Data Loader`** (`@n8n/n8n-nodes-langchain.documentDefaultDataLoader`)
  - **Input Schema**: `"jsonData": "={{ $json.emailSummary }}"` from email summarization
  - **Metadata**: Includes `"threadId": "={{ $json.id }}"` for email thread association
  - **Output**: Feeds `Write - Threads History Vector Store2` via `ai_document`

- **`Token Splitter`** (`@n8n/n8n-nodes-langchain.textSplitterTokenSplitter`)
  - **Parameters**: `"chunkSize": 2000` - splits large emails into manageable chunks
  - **Position**: `[1580, 630]`
  - **Connection**: Uses `ai_textSplitter` connection type

### Vector Store Tool Integration
- **`Research context and infos in previous conversations`** (`toolVectorStore`)
  - **Description**: "Can answer questions and do research in previous email conversations. Use this tool whenever you need more context about past conversations to an email. For better retrieval and more context always pass the email-adresses to the query!"
  - **Input**: Vector data from `Postgres PGVector Store1` via `ai_vectorStore`
  - **Language Model**: Connected to `OpenAI Chat Model1` via `ai_languageModel`
  - **Output**: Provides context retrieval capability to `EMail Agent` via `ai_tool`

### Connection Types & Data Flow
- **`ai_embedding`**: Embeddings → Vector Stores
- **`ai_vectorStore`**: Vector Stores → Vector Store Tools
- **`ai_document`**: Document Loaders → Vector Stores
- **`ai_textSplitter`**: Text Splitters → Document Loaders
- **`ai_languageModel`**: Language Models → Vector Store Tools
- **`ai_tool`**: Vector Store Tools → AI Agents

## Voice Processing Pipeline
Telegram voice messages follow this flow:
1. `Telegram Trigger` detects voice message
2. `Get a file` retrieves audio file
3. `Transcribe a recording` converts to text
4. Standard chat processing continues

## Key Configuration Areas
When modifying workflows:
1. **Email Classification**: Update categories in `Classify Emails` textClassifier
2. **Gmail Labels**: Adjust label IDs in assignment nodes (e.g., `Label_1930811300236635888`)
3. **Calendar Access**: Configure calendar IDs in Google Calendar tool nodes
4. **System Prompts**: Modify AI agent prompt for role/company context
5. **Credentials**: Update OAuth2 tokens for Gmail/Calendar/Telegram access
6. **Vector Descriptions**: Update tool descriptions for better AI context

## Testing & Debugging
- **Manual Testing**: Use `When clicking 'Test workflow'` trigger
- **Pinned Data**: Test data stored in `pinData` section for consistent testing
- **Node Positioning**: Visual layout aids debugging via position coordinates
- **Sticky Notes**: Documentation nodes explain workflow sections
- **Error Handling**: `onError: "continueErrorOutput"` for classification failures
