import streamlit as st
import os
from services.llm_client import query_llm
# from services.rag_client import ingest_text, ingest_file, query_rag
from services.rag_client import ingest_text, query_rag

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")

st.set_page_config(page_title="DMZ LLM", layout="centered")
st.title("DMZ LLM")

# tab_chat, 
tab_ingest, tab_query = st.tabs(["📥 RAG Ingest", "🔎 RAG Query"])

# # ---- Chat tab ----
# with tab_chat:
#     st.markdown("Enter a prompt or paste a document below:")
#     prompt = st.text_area("Prompt", height=200, key="chat_prompt")
#     if st.button("Send to LLM", key="chat_send"):
#         if not prompt.strip():
#             st.warning("Please enter a prompt before sending.")
#         else:
#             with st.spinner("Waiting for LLM response..."):
#                 response = query_llm(prompt, model=OLLAMA_MODEL)
#                 st.success("LLM responded:")
#                 st.write(response)

# ---- RAG Ingest tab ----
with tab_ingest:
    # st.subheader("Add text or a file to the knowledge base")
    st.subheader("Add text to the knowledge base")
    with st.form("ingest_text_form", clear_on_submit=False):
        doc_id = st.text_input("Optional Document ID (helps you track sources)")
        text = st.text_area("Text to ingest", height=180)
        submitted = st.form_submit_button("Ingest Text")
        if submitted:
            if not text.strip():
                st.warning("Please add some text.")
            else:
                with st.spinner("Ingesting..."):
                    res = ingest_text(doc_id or None, text)
                if res.get("ok"):
                    st.success(f"Ingested {res.get('chunks', 0)} chunk(s) with doc_id={res.get('doc_id')}")
                else:
                    st.error(f"Ingest failed: {res.get('error')}")
                    if res.get("raw"):
                        st.code(res["raw"])

    # st.markdown("---")
    # st.subheader("Or upload a file")
    # up_doc_id = st.text_input("Optional Document ID for file")
    # uploaded = st.file_uploader("Upload a .txt or .md file", type=["txt", "md"])
    # if st.button("Ingest File"):
    #     if not uploaded:
    #         st.warning("Please choose a file first.")
    #     else:
    #         with st.spinner("Uploading & ingesting..."):
    #             res = ingest_file(uploaded.read(), uploaded.name, up_doc_id or None)
    #         if res.get("ok"):
    #             st.success(f"File ingested as doc_id={res.get('doc_id')}")
    #         else:
    #             st.error(f"Ingest failed: {res.get('error')}")
    #             if res.get("raw"):
    #                 st.code(res["raw"])

# ---- RAG Query tab ----
with tab_query:
    st.subheader("Ask a question (answers grounded in ingested docs)")
    question = st.text_input("Your question", key="rag_question")
    k = st.slider("How many chunks to retrieve", min_value=1, max_value=8, value=4)
    if st.button("Ask", key="rag_ask"):
        if not question.strip():
            st.warning("Please enter a question.")
        else:
            with st.spinner("Searching and generating..."):
                res = query_rag(question, k=k)
            if not res.get("ok"):
                st.error(f"Query failed: {res.get('error')}")
                if res.get("raw"):
                    st.code(res["raw"])
            else:
                st.success("Answer")
                st.write(res.get("answer", ""))
                sources = res.get("sources", [])
                if sources:
                    st.markdown("**Sources** (top matches):")
                    for i, s in enumerate(sources, 1):
                        meta = s.get("metadata", {})
                        st.caption(f"{i}. doc_id={meta.get('doc_id')}  chunk={meta.get('chunk')}  distance={s.get('distance'):.4f}")
                        with st.expander(f"View chunk {i}"):
                            st.write(s.get("document", ""))
                else:
                    st.info("No sources returned.")
