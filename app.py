from quart import Quart, render_template, send_from_directory, request, redirect
from g4f.client import Client
from werkzeug.exceptions import HTTPException
import os
import json
import asyncio
import base64

app = Quart(__name__, static_folder='static')

client = Client()

async def error_page_handler(error_code):
    error_messages = {
        400: 'Некорректный запрос',
        401: 'Требуется авторизация',
        403: 'Доступ запрещен',
        404: 'Страница не найдена',
        500: 'Внутренняя ошибка сервера',
        503: 'Сервис временно недоступен'
    }
    
    error_descriptions = {
        400: 'Сервер не может обработать запрос из-за ошибки клиента.',
        401: 'Для доступа к этому ресурсу требуется авторизация.',
        403: 'У вас нет прав доступа к этому ресурсу.',
        404: 'Запрашиваемая страница не существует или была перемещена.',
        500: 'На сервере произошла непредвиденная ошибка. Попробуйте позже.',
        503: 'Сервис временно недоступен из-за технических работ или перегрузки.'
    }
    
    error_message = error_messages.get(error_code, 'Произошла ошибка')
    error_description = error_descriptions.get(error_code, 'Что-то пошло не так. Попробуйте вернуться на главную страницу или повторить попытку позже.')
    
    context = {
        'error_code': error_code,
        'error_message': error_message,
        'error_description': error_description
    }
    
    return await render_template('error.html', **context), error_code

@app.errorhandler(400)
async def bad_request(error):
    return await error_page_handler(400)

@app.errorhandler(401)
async def unauthorized(error):
    return await error_page_handler(401)

@app.errorhandler(403)
async def forbidden(error):
    return await error_page_handler(403)

@app.errorhandler(404)
async def not_found(error):
    return await error_page_handler(404)

@app.errorhandler(500)
async def internal_server_error(error):
    return await error_page_handler(500)

@app.errorhandler(503)
async def service_unavailable(error):
    return await error_page_handler(503)

@app.errorhandler(HTTPException)
async def handle_http_exception(error):
    return await error_page_handler(error.status_code)

@app.errorhandler(Exception)
async def handle_exception(error):
    return await error_page_handler(500)

@app.route('/')
async def index():
    return await render_template('index.html')

@app.route('/error')
async def error_page():
    error_code = int(request.args.get('code', '404'))
    return await error_page_handler(error_code)

@app.route('/services')
async def services_no_ext():
    return await render_template('services.html')

@app.route('/about')
async def about_no_ext():
    return await render_template('about.html')

@app.route('/contacts')
async def contacts_no_ext():
    return await render_template('contacts.html')

@app.route('/services.html')
async def services():
    return await render_template('services.html')

@app.route('/about.html')
async def about():
    return await render_template('about.html')

@app.route('/contacts.html')
async def contacts():
    return await render_template('contacts.html')

@app.route('/img2prompt')
async def img2prompt_page():
    return await render_template('img2prompt.html')

@app.route('/<path:filename>')
async def static_files(filename):
    return await send_from_directory('static', filename)

@app.route('/api/search')
async def search():
    query = request.args.get('q', '').lower()
    if not query:
        return json.dumps([])
    
    blocked_keywords = ["porn", "порно", "наркотики", "drugs", "illegal", "оружие", "weapons", "bomb", "бомба"]
    is_blocked = any(keyword in query.lower() for keyword in blocked_keywords)
    
    if is_blocked:
        return json.dumps({
            "thinking": "Этот запрос содержит потенциально неприемлемый контент, который может нарушать правила сервиса или законы. Пожалуйста, используйте сервис для поиска легальных и этичных ИИ-инструментов.",
            "services": []
        })
    
    if query == 'популярные':
        popular_prompt = """Сгенерируй популярные ИИ-сервисы в формате JSON. 
        Каждый сервис должен содержать поля:
        - id (число)
        - name (название сервиса)
        - category (категория, например "Генерация изображений")
        - description (краткое описание сервиса, 1-2 предложения)
        - icon (уникальная и красивая SVG иконка, соответствующая категории сервиса, в формате строки, размером 64x64, только используй stroke="currentColor" и fill="none")
        - tags (массив ключевых слов для поиска)
        - pricing (строка, одно из: "free", "paid", "freemium")
        - url (рабочая ссылка на официальный сайт сервиса)
        
        Сервисы должны быть отсортированы по популярности и качеству: сначала самые лучшие и известные.
        Возвращай только реальные существующие сервисы с правильными ссылками.
        
        Верни только JSON массив без пояснений. Формат должен быть валидным JSON.
        """
        try:
            response = await asyncio.to_thread(
                lambda: client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": popular_prompt}],
                    web_search=False
                )
            )
            response_text = response.choices[0].message.content
            json_start = response_text.find('[')
            json_end = response_text.rfind(']') + 1
            if json_start != -1 and json_end != -1:
                json_text = response_text[json_start:json_end]
                thinking_prompt = """Напиши краткое рассуждение (максимум 2 предложения) о том, как ты выбирал самые популярные ИИ-сервисы. 
                Не пиши шаблонно, используй естественный язык."""
                
                thinking_response = await asyncio.to_thread(
                    lambda: client.chat.completions.create(
                        model="gpt-4o-mini",
                        messages=[{"role": "user", "content": thinking_prompt}],
                        web_search=False
                    )
                )
                thinking_text = thinking_response.choices[0].message.content
                
                return json.dumps({
                    "thinking": thinking_text,
                    "services": json.loads(json_text)
                })
            else:
                return json.dumps({
                    "thinking": "Не удалось получить информацию о популярных сервисах. Пожалуйста, попробуйте еще раз.",
                    "services": []
                })
        except Exception as e:
            print(f"Ошибка при получении популярных сервисов: {e}")
            return json.dumps({
                "thinking": "Произошла ошибка при обработке запроса. Пожалуйста, попробуйте еще раз позже.",
                "services": []
            })
    
    prompt = f"""Сгенерируй ИИ-сервисы, соответствующие запросу "{query}", в формате JSON.
    Найди и верни ВСЕ возможные сервисы, которые подходят под запрос, независимо от их количества.
    Каждый сервис должен содержать поля:
    - id (число)
    - name (название сервиса)
    - category (категория, например "Генерация изображений")
    - description (краткое описание сервиса, 1-2 предложения)
    - icon (уникальная и красивая SVG иконка, соответствующая категории сервиса, в формате строки, размером 64x64, только используй stroke="currentColor" и fill="none")
    - tags (массив ключевых слов для поиска)
    - pricing (строка, одно из: "free", "paid", "freemium")
    - url (рабочая ссылка на официальный сайт сервиса)
    
    Важно! Результаты должны быть отсортированы от самых лучших и популярных к менее известным.
    Возвращай только реальные существующие сервисы с правильными ссылками.
    Постарайся найти максимально широкий спектр инструментов, соответствующих запросу, не ограничивайся только самыми известными.
    
    Верни только JSON массив без пояснений. Формат должен быть валидным JSON.
    """
    
    try:
        response = await asyncio.to_thread(
            lambda: client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                web_search=False
            )
        )
        response_text = response.choices[0].message.content
        json_start = response_text.find('[')
        json_end = response_text.rfind(']') + 1
        if json_start != -1 and json_end != -1:
            json_text = response_text[json_start:json_end]
            
            thinking_prompt = f"""Ты только что нашел ИИ-сервисы по запросу "{query}". 
            Напиши краткое, но естественное рассуждение (максимум 2 предложения) о результатах поиска.
            Упомяни особенности найденных сервисов и то, как они могут помочь с запросом."""
            
            thinking_response = await asyncio.to_thread(
                lambda: client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "user", "content": f"Результаты поиска ИИ-сервисов по запросу '{query}': {json_text}"},
                        {"role": "user", "content": thinking_prompt}
                    ],
                    web_search=False
                )
            )
            thinking_text = thinking_response.choices[0].message.content
            
            return json.dumps({
                "thinking": thinking_text,
                "services": json.loads(json_text)
            })
        else:
            thinking_prompt = f"""Ты не смог найти ИИ-сервисы по запросу "{query}". 
            Напиши краткое, но естественное рассуждение (максимум 2 предложения) о том, почему это могло произойти."""
            
            thinking_response = await asyncio.to_thread(
                lambda: client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": thinking_prompt}],
                    web_search=False
                )
            )
            thinking_text = thinking_response.choices[0].message.content
            
            return json.dumps({
                "thinking": thinking_text,
                "services": []
            })
    except Exception as e:
        print(f"Ошибка при поиске: {e}")
        return json.dumps({
            "thinking": "Произошла ошибка при обработке запроса. Пожалуйста, попробуйте еще раз позже.",
            "services": []
        })

@app.route('/api/img2prompt', methods=['POST'])
async def analyze_image():
    try:
        data = await request.get_json()
        if not data or 'image' not in data:
            return json.dumps({
                "error": "Изображение не было предоставлено"
            }), 400
        
        image_data = data['image']
        
        prompt = """Проанализируй изображение и создай детальный промпт, который можно использовать 
        в нейросетях для генерации подобного изображения (например, в Midjourney, DALL-E или Stable Diffusion).
        
        Промпт должен содержать:
        1. Детальное описание содержимого изображения
        2. Стиль и художественные особенности
        3. Цветовую гамму и освещение
        4. Композицию и перспективу
        5. Технические аспекты (например, 4k, фотореалистичность, 3D рендер)
        
        Верни промпт на английском языке, он должен быть максимально подробным и эффективным для генерации аналогичного изображения.
        В ответе используй только текст промпта, без пояснений."""
        
        refusal_phrases = [
            "I'm sorry, but I can't assist with that",
            "I apologize, but I cannot",
            "I'm unable to assist",
            "Sorry, I cannot",
            "I can't assist with"
        ]
        
        prompt_generated = False
        max_attempts = 3
        attempts = 0
        prompt_text = ""
        
        while not prompt_generated and attempts < max_attempts:
            attempts += 1
            try:
                response = await asyncio.to_thread(
                    lambda: client.chat.completions.create(
                        model="gpt-4o-mini",
                        messages=[
                            {"role": "user", "content": [
                                {"type": "text", "text": prompt},
                                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_data}"}}
                            ]}
                        ],
                        web_search=False
                    )
                )
                
                prompt_text = response.choices[0].message.content.strip()
                
                if not any(phrase.lower() in prompt_text.lower() for phrase in refusal_phrases):
                    prompt_generated = True
                else:
                    prompt = """Опиши изображение детально в виде промпта для генератора изображений. 
                    Сфокусируйся на объектах, стиле, цветах, освещении, композиции и технических аспектах.
                    Используй нейтральный стиль описания. Не отказывайся анализировать изображение.
                    Твоя задача - просто описать то, что ты видишь, чтобы можно было воссоздать похожее изображение.
                    Верни только текст промпта на английском языке."""
                    
                    await asyncio.sleep(1)
            except Exception as e:
                print(f"Ошибка при попытке {attempts}: {e}")
                await asyncio.sleep(2)
        
        if not prompt_generated:
            return json.dumps({
                "error": "Не удалось сгенерировать промпт после нескольких попыток. Пожалуйста, загрузите другое изображение."
            }), 500
        
        translation_prompt = f"""Переведи следующий промпт для генерации изображений на русский язык, сохраняя все детали и технические термины:
        
        {prompt_text}
        
        Верни только перевод, без дополнительных комментариев."""
        
        translation_response = await asyncio.to_thread(
            lambda: client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": translation_prompt}],
                web_search=False
            )
        )
        
        translated_prompt = translation_response.choices[0].message.content.strip()
        
        thinking_prompt = "Напиши очень короткое (1-2 предложения) содержательное рассуждение о том, что ты заметил в этом изображении и какие ключевые элементы ты выделил для промпта."
        
        thinking_response = await asyncio.to_thread(
            lambda: client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "user", "content": [
                        {"type": "text", "text": thinking_prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_data}"}}
                    ]}
                ],
                web_search=False
            )
        )
        
        thinking_text = thinking_response.choices[0].message.content
        
        return json.dumps({
            "prompt": prompt_text,
            "translated_prompt": translated_prompt,
            "thinking": thinking_text
        })
        
    except Exception as e:
        print(f"Ошибка при анализе изображения: {e}")
        return json.dumps({
            "error": "Произошла ошибка при анализе изображения. Пожалуйста, попробуйте еще раз позже."
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='127.0.0.1', port=port)