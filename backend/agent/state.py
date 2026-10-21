"""
Agent State Schema for LangGraph coordination.
Tracks message history, tool calls, RAG citations, and human approval status.
"""

from typing import List, Dict, Any, Optional, TypedDict


class AgentActivityStep(TypedDict):
    id: str
    type: str  # 'thinking' | 'tool' | 'memory' | 'approval' | 'generating'
    label: str
    detail: Optional[str]
    timestamp: str
    status: str  # 'pending' | 'active' | 'completed' | 'denied'


class PendingAction(TypedDict):
    action_id: str
    tool_name: str
    description: str
    parameters: Dict[str, Any]
    impact: str  # 'read_only' | 'file_write' | 'cli_execution' | 'system_change'
    requires_approval: bool
    status: str  # 'pending' | 'approved' | 'rejected'


class DarshanAgentState(TypedDict):
    user_id: Optional[str]
    conversation_id: str
    messages: List[Dict[str, str]]
    model: str
    temperature: float
    enable_memory: bool
    enable_tools: bool
    retrieved_context: str
    citations: List[Dict[str, Any]]
    activity_steps: List[AgentActivityStep]
    pending_action: Optional[PendingAction]
    final_reply: str
