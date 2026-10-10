from chain_craft import build_chain
from llm_interaction import get_llm, llm_run


def service(raw: str, role: str):
    llm = get_llm()
    chain = build_chain(llm)
    result = llm_run(raw, role, chain)
    return result.content



