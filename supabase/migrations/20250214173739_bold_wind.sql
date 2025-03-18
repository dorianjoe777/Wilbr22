/*
  # Insert Initial Configuration Data

  1. Data Insertion
    - Insert default conversation flow
    - Insert basic configurations
*/

-- Insert basic conversation flow
INSERT INTO conversations (event, entry, output_text, return_to) VALUES
('Start', 'Hola,hola,buenos dias,buenas tardes,Hi,hi,MENU,Menu,%%%', 'Hola soy el asistente virtual, ¿en qué puedo ayudarte?', 'Chatgpt_Ejecutivo'),
('Chatgpt_Ejecutivo', NULL, NULL, 'Chatgpt_Ejecutivo'),
('Error', NULL, 'Lo siento no entiendo', 'Chatgpt_Ejecutivo'),
('EndCotizacion', NULL, '✅ ¡Gracias! su pedido @pedido@ se esta alistando... 😊📦', 'Chatgpt_Ejecutivo')
ON CONFLICT DO NOTHING;

-- Insert basic configurations
INSERT INTO configurations (key, value, description) VALUES
('API', NULL, 'WhatsApp API URL'),
('TOKEN_META', NULL, 'WhatsApp Business Token'),
('URL_WEBHOOK', NULL, 'Webhook URL'),
('TOKEN_CHATGPT', NULL, 'OpenAI API Key'),
('MODELO_CHATGPT', 'gpt-4', 'GPT Model to use'),
('Entrenamiento', 'Eres ChatBOT que vende frutas debes brindar respuestas amigables y cortas sin indicar que eres IA
Paso 1 debe solicitar el nombre al cliente
Paso 2 debe ofrecer los productos que vendes los cuales son : manzana a 2 soles el kilo, papaya a 1 sol el kilo , plátano a 5 soles el kilo , sandía 1 sol el kilo.
Paso 3 cuando termine la venta debes brindar el detalle de la venta para que el cliente confirme , solo cuando se confirme la venta debes responder únicamente Lead en Proceso!', 'Bot training instructions'),
('Palabras Cierre', 'Lead en Proceso', 'Closing keywords'),
('Entrenamiento Recuperar Datos', 'Eres un analizador de conversaciones recibiras la conversacion de un cliente con nuestra empresa y procederas a realizar los siguientes pasos:
Paso 1: Analizar la conversacion
Paso 2: Solo proporcionar una respuesta JSON compatible con RFC8259 siguiendo este formato sin desviaciones utilizando los datos de la ultima conversacion
{"nombre":"Nombre Cliente","productos":"Productos"}', 'Data recovery training')
ON CONFLICT DO NOTHING;