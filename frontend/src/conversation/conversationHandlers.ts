import conversationService from '../api/services/conversationService';
import { Doc } from '../preferences/preferenceApi';
import { Answer, FEEDBACK } from './conversationModels';

function getDocPath(selectedDocs: Doc | null): string {
  let docPath = 'default';
  if (selectedDocs) {
    let namePath = selectedDocs.name;
    if (selectedDocs.language === namePath) {
      namePath = '.project';
    }
    if (selectedDocs.location === 'local') {
      docPath = 'local' + '/' + selectedDocs.name + '/';
    } else if (selectedDocs.location === 'remote') {
      docPath =
        selectedDocs.language +
        '/' +
        namePath +
        '/' +
        selectedDocs.version +
        '/' +
        selectedDocs.model +
        '/';
    } else if (selectedDocs.location === 'custom') {
      docPath = selectedDocs.docLink;
    }
  }
  return docPath;
}

export function handleFetchAnswer(
  question: string,
  signal: AbortSignal,
  selectedDocs: Doc | null,
  history: Array<any> = [],
  conversationId: string | null,
  promptId: string | null,
  chunks: string,
  token_limit: number,
): Promise<
  | {
      result: any;
      answer: any;
      sources: any;
      conversationId: any;
      query: string;
    }
  | {
      result: any;
      answer: any;
      sources: any;
      query: string;
      conversationId: any;
      title: any;
    }
> {
  const docPath = getDocPath(selectedDocs);
  history = history.map((item) => {
    return { prompt: item.prompt, response: item.response };
  });
  return conversationService
    .answer(
      {
        question: question,
        history: history,
        active_docs: docPath,
        conversation_id: conversationId,
        prompt_id: promptId,
        chunks: chunks,
        token_limit: token_limit,
      },
      signal,
    )
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        return Promise.reject(new Error(response.statusText));
      }
    })
    .then((data) => {
      const result = data.answer;
      return {
        answer: result,
        query: question,
        result,
        sources: data.sources,
        conversationId: data.conversation_id,
      };
    });
}

export function handleFetchAnswerSteaming(
  question: string,
  signal: AbortSignal,
  selectedDocs: Doc | null,
  history: Array<any> = [],
  conversationId: string | null,
  promptId: string | null,
  chunks: string,
  token_limit: number,
  model: string,
  onEvent: (event: MessageEvent) => void,
): Promise<Answer> {
  const docPath = getDocPath(selectedDocs);
  history = history.map((item) => {
    return { prompt: item.prompt, response: item.response };
  });
  return new Promise<Answer>((resolve, reject) => {
    conversationService
      .answerStream(
        {
          question: question,
          active_docs: docPath,
          history: JSON.stringify(history),
          conversation_id: conversationId,
          prompt_id: promptId,
          chunks: chunks,
          token_limit: token_limit,
          model: model,
        },
        signal,
      )
      .then((response) => {
        if (!response.body) throw Error('No response body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let counterrr = 0;
        const processStream = ({
          done,
          value,
        }: ReadableStreamReadResult<Uint8Array>) => {
          if (done) {
            console.log(counterrr);
            return;
          }

          counterrr += 1;

          const chunk = decoder.decode(value);

          const lines = chunk.split('\n');

          for (let line of lines) {
            if (line.trim() == '') {
              continue;
            }
            if (line.startsWith('data:')) {
              line = line.substring(5);
            }

            const messageEvent: MessageEvent = new MessageEvent('message', {
              data: line,
            });

            onEvent(messageEvent); // handle each message
          }

          reader.read().then(processStream).catch(reject);
        };

        reader.read().then(processStream).catch(reject);
      })
      .catch((error) => {
        console.error('Connection failed:', error);
        reject(error);
      });
  });
}

export function handleSearch(
  question: string,
  selectedDocs: Doc | null,
  conversation_id: string | null,
  history: Array<any> = [],
  chunks: string,
  token_limit: number,
  model: string,
) {
  const docPath = getDocPath(selectedDocs);
  return conversationService
    .search({
      question: question,
      active_docs: docPath,
      conversation_id,
      history,
      chunks: chunks,
      token_limit: token_limit,
      model: model,
    })
    .then((response) => response.json())
    .then((data) => {
      return data;
    })
    .catch((err) => console.log(err));
}

export function handleSendFeedback(
  prompt: string,
  response: string,
  feedback: FEEDBACK,
) {
  return conversationService
    .feedback({
      question: prompt,
      answer: response,
      feedback: feedback,
    })
    .then((response) => {
      if (response.ok) {
        return Promise.resolve();
      } else {
        return Promise.reject();
      }
    });
}

export function handleFetchSharedAnswerStreaming( //for shared conversations
  question: string,
  signal: AbortSignal,
  apiKey: string,
  history: Array<any> = [],
  onEvent: (event: MessageEvent) => void,
): Promise<Answer> {
  history = history.map((item) => {
    return { prompt: item.prompt, response: item.response };
  });

  return new Promise<Answer>((resolve, reject) => {
    const payload = {
      question: question,
      history: JSON.stringify(history),
      api_key: apiKey,
    };
    conversationService
      .answerStream(payload, signal)
      .then((response) => {
        if (!response.body) throw Error('No response body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let counterrr = 0;
        const processStream = ({
          done,
          value,
        }: ReadableStreamReadResult<Uint8Array>) => {
          if (done) {
            console.log(counterrr);
            return;
          }

          counterrr += 1;

          const chunk = decoder.decode(value);

          const lines = chunk.split('\n');

          for (let line of lines) {
            if (line.trim() == '') {
              continue;
            }
            if (line.startsWith('data:')) {
              line = line.substring(5);
            }

            const messageEvent: MessageEvent = new MessageEvent('message', {
              data: line,
            });

            onEvent(messageEvent); // handle each message
          }

          reader.read().then(processStream).catch(reject);
        };

        reader.read().then(processStream).catch(reject);
      })
      .catch((error) => {
        console.error('Connection failed:', error);
        reject(error);
      });
  });
}

export function handleFetchSharedAnswer(
  question: string,
  signal: AbortSignal,
  apiKey: string,
): Promise<
  | {
      result: any;
      answer: any;
      sources: any;
      query: string;
    }
  | {
      result: any;
      answer: any;
      sources: any;
      query: string;
      title: any;
    }
> {
  return conversationService
    .answer(
      {
        question: question,
        api_key: apiKey,
      },
      signal,
    )
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        return Promise.reject(new Error(response.statusText));
      }
    })
    .then((data) => {
      const result = data.answer;
      return {
        answer: result,
        query: question,
        result,
        sources: data.sources,
      };
    });
}
