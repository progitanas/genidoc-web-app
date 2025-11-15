# GeniDoc Yallah 1.0 – LLM/RAG Demo Integration

## API Endpoint (Demo)

- `POST /api/chat`
  - Body: `{ "message": "Votre question ici" }`
  - Response: `{ success: true, response: "..." }`

## Client Usage (Sidebar)

- Ouvrez le dashboard, cliquez sur la flèche "Chatbot" à gauche.
- Posez une question, la réponse provient de `/api/chat` (demo).

## Variables d'environnement requises

- `PORT` (optionnel, défaut 3000)
- (Pour LLM réel) :
  - `OPENAI_API_KEY` (pour GPT-4, OpenAI)
  - `GEMINI_API_KEY` (pour Gemini)
  - `VECTOR_DB_URL` (pour RAG avancé)

## Exemple de requête curl

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Bonjour, que peut faire GeniDoc ?"}'
```

## Pour aller plus loin
- Branchez une vraie clé API dans le backend pour activer l'IA réelle.
- Voir le fichier `genidocyallah1.0.html` pour la présentation complète des technologies.
