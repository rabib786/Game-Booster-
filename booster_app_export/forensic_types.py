from dataclasses import dataclass
from typing import List, Dict, Any, Optional
import datetime

@dataclass
class ProcessSnapshot:
    """Snapshot of a process state for automated rollback."""
    pid: int
    name: str
    exe_path: str
    cmdline: List[str]
    cwd: str
    environ: Dict[str, str]

@dataclass
class TerminationAuditLog:
    """Forensic logging for process termination events."""
    timestamp: str
    target_pid: int
    target_name: str
    target_hash: Optional[str]
    heuristic_risk_score: int
    contributing_factors: List[str]
    termination_method: str
    authorization_status: str
    execution_context: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "timestamp": self.timestamp,
            "target_pid": self.target_pid,
            "target_name": self.target_name,
            "target_hash": self.target_hash,
            "heuristic_risk_score": self.heuristic_risk_score,
            "contributing_factors": self.contributing_factors,
            "termination_method": self.termination_method,
            "authorization_status": self.authorization_status,
            "execution_context": self.execution_context
        }
