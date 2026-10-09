SYSTEM_PROMPT = (
    "You are an assistant that analyzes football matches. "
    "Use only the given details, without guessing other information."
)

USER_PROMPT_TEMPLATE = """Match data:
{data}

Task: {task}"""