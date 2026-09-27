import type { ChatSession, DocumentItem, User } from '../types'

export const CURRENT_USER: User = {
  id: 'usr_abhishek_01',
  name: 'Abhishek',
  email: 'abhishek@brain.ai',
  role: 'admin',
}

export const INITIAL_CHATS: ChatSession[] = [
  {
    id: 'chat_python',
    title: 'Python',
    icon: 'python',
    description: 'Async concurrency, GIL internals, and FastAPI architecture',
    updatedAt: '10m ago',
    pinned: true,
    messages: [
      {
        id: 'msg_py_1',
        sender: 'user',
        content: 'How does Python 3.13 free-threading affect concurrent IO and CPU-bound tasks?',
        timestamp: '10:24 AM',
      },
      {
        id: 'msg_py_2',
        sender: 'assistant',
        content:
          'Python 3.13 introduces experimental **free-threaded mode (PEP 703)**, allowing CPython to run without the Global Interpreter Lock (GIL).\n\n### Key Takeaways:\n- **CPU-bound tasks**: True multi-core parallelism is now possible within a single Python process using `threading` or `concurrent.futures.ThreadPoolExecutor` without spawning separate `multiprocessing` processes.\n- **IO-bound tasks**: `asyncio` remains optimal for massive concurrent socket connections, but free-threading eliminates lock contention when worker threads process decoded payloads.\n- **Thread Safety**: Mutable data structures (dicts, lists) are protected via fine-grained locking or mimalloc thread-safe arenas.',
        timestamp: '10:24 AM',
        reasoning:
          'Analyzed PEP 703, mimalloc memory allocator integration, and benchmark comparisons between GIL vs free-threaded CPython 3.13t build.',
        codeSnippet: {
          language: 'python',
          title: 'bench_parallel_compute.py',
          code: `import concurrent.futures
import time

def compute_heavy(n: int) -> int:
    return sum(i * i for i in range(n))

def run_benchmark():
    start = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(compute_heavy, 10_000_000) for _ in range(4)]
        results = [f.result() for f in futures]
    print(f"Executed 4 parallel tasks in {time.perf_counter() - start:.2f}s")

if __name__ == "__main__":
    run_benchmark()`,
        },
      },
    ],
  },
  {
    id: 'chat_react',
    title: 'React',
    icon: 'react',
    description: 'React 19 hooks, server components, and performance patterns',
    updatedAt: '1h ago',
    pinned: true,
    messages: [
      {
        id: 'msg_re_1',
        sender: 'user',
        content: 'Can you show a clean, reusable React hook for debouncing fast user input with TypeScript?',
        timestamp: '9:15 AM',
      },
      {
        id: 'msg_re_2',
        sender: 'assistant',
        content:
          'Here is an efficient `useDebounce` hook that handles generic value types, cleans up pending timeouts on unmount, and avoids unnecessary re-renders:',
        timestamp: '9:15 AM',
        codeSnippet: {
          language: 'typescript',
          title: 'useDebounce.ts',
          code: `import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}`,
        },
      },
    ],
  },
  {
    id: 'chat_rag',
    title: 'RAG',
    icon: 'rag',
    description: 'Retrieval Augmented Generation, vector embeddings, and reranking',
    updatedAt: '3h ago',
    pinned: false,
    messages: [
      {
        id: 'msg_rag_1',
        sender: 'user',
        content: 'What is the optimal hybrid search strategy combining BM25 and dense vector search?',
        timestamp: '7:42 AM',
      },
      {
        id: 'msg_rag_2',
        sender: 'assistant',
        content:
          'Hybrid search combines the exact keyword recall of **BM25** (lexical) with the semantic semantic comprehension of **Dense Embeddings** (e.g., Cohere, OpenAI text-embedding-3).\n\n### Best Practice Architecture:\n1. **Reciprocal Rank Fusion (RRF)**: Compute rank scores: `RRF_Score = 1 / (60 + rank_bm25) + 1 / (60 + rank_dense)`.\n2. **Cross-Encoder Reranker**: Take the top 30-50 candidates from RRF and pass through a Cohere Rerank v3 or BGE-Reranker model to yield final top 5 context passages.\n3. **Context Window Compression**: Filter irrelevant sentences to preserve token budget for LLM generation.',
        timestamp: '7:43 AM',
      },
    ],
  },
  {
    id: 'chat_ai_agents',
    title: 'AI Agents',
    icon: 'agent',
    description: 'Autonomous multi-agent swarms, tool use, and self-reflection loops',
    updatedAt: 'Yesterday',
    pinned: false,
    messages: [
      {
        id: 'msg_ag_1',
        sender: 'user',
        content: 'How should multi-agent systems handle loop detection and task handoffs?',
        timestamp: 'Yesterday',
      },
      {
        id: 'msg_ag_2',
        sender: 'assistant',
        content:
          'In production agent swarms (e.g. supervisor-worker patterns), implement **state graph checkpoints** and **entropy guards**:\n\n- **Maximum Recursion Depth**: Guardrails preventing loops from running > 15 iterations.\n- **State Diff Inspection**: If an agent emits the same tool call with identical parameters twice consecutively, trigger a Reflection Node to reformulate strategy.\n- **Structured Output Handoff**: Agents pass typed state payloads rather than free-form natural language to maintain schema determinism.',
        timestamp: 'Yesterday',
      },
    ],
  },
]

export const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc_resume',
    name: 'Resume.pdf',
    size: '142 KB',
    pages: 2,
    type: 'application/pdf',
    uploadedAt: 'Sep 26, 2026',
    previewSnippet:
      'Abhishek Srivastva — Staff Software Engineer & AI Architect.\nExpertise: React, TypeScript, Python, LLM orchestration, RAG pipelines, distributed systems.\nSelected Experience: Built high-throughput intelligence platforms, low-latency microservices, and design systems.',
    topics: ['Full-Stack', 'AI Systems', 'System Design', 'TypeScript', 'Python'],
  },
  {
    id: 'doc_project',
    name: 'Project.pdf',
    size: '2.4 MB',
    pages: 18,
    type: 'application/pdf',
    uploadedAt: 'Sep 25, 2026',
    previewSnippet:
      'Brain AI Project Specification Document — Version 2.4.\nExecutive Summary: Next-generation cognitive workspace featuring multi-modal agent interaction, contextual vector search across user documents, and modular design token architecture.',
    topics: ['Architecture', 'Vector Database', 'API Gateway', 'Multi-tenant RAG'],
  },
]

export const QUICK_PROMPTS = [
  {
    title: 'Explain Python GIL & Concurrency',
    subtitle: 'CPython 3.13 free-threaded execution internals',
    prompt: 'Can you explain how Python 3.13 free-threading removes the GIL and its effect on CPU-bound vs IO-bound tasks?',
    icon: 'python',
    category: 'Python',
  },
  {
    title: 'Build custom React debounce hook',
    subtitle: 'TypeScript, cleanup lifecycle & optimal re-renders',
    prompt: 'Write an idiomatic, production-grade useDebounce hook in React 19 with TypeScript and full unit test examples.',
    icon: 'react',
    category: 'React',
  },
  {
    title: 'Design RAG retrieval pipeline',
    subtitle: 'Hybrid BM25 + dense vectors with reranker',
    prompt: 'What is the optimal hybrid search pipeline combining BM25 lexical search with vector embeddings and cross-encoder reranking?',
    icon: 'rag',
    category: 'RAG',
  },
  {
    title: 'Multi-Agent autonomous loop',
    subtitle: 'Tool use, error recovery & state handoff',
    prompt: 'How do you architect a multi-agent system with supervisor routing, tool validation, and cycle detection?',
    icon: 'agent',
    category: 'AI Agents',
  },
  {
    title: 'Query Resume.pdf for core skills',
    subtitle: 'Contextual RAG extraction from uploaded document',
    prompt: 'Based on the attached Resume.pdf, what are Abhishek’s core technical competencies and leadership achievements?',
    icon: 'doc',
    category: 'Documents',
    attachDoc: 'Resume.pdf',
  },
]
