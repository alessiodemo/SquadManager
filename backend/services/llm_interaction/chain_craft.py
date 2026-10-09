from langchain_core.prompts import ChatPromptTemplate
from llangchain_core.output_parsers import StrOutputParser
from prompt_building import build_prompt
from langchain_core.language_models.fake_chat_models import FakeListChatModel

prompt = ChatPromptTemplate(build_prompt())

parser = StrOutputParser()

llm = FakeListChatModel(responses=["[FAKE] La partita è finita 3-0 per i padroni di casa."])

def build_chain (llm):
    return prompt | llm | parser