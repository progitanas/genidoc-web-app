package com.genidocmobile

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.PasswordVisualTransformation
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import android.widget.Toast

@Composable
fun RegisterScreen(
    onRegisterSuccess: (String) -> Unit,
    onBack: () -> Unit
) {
    var username by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var birthdate by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("Créer un compte GeniDoc", style = MaterialTheme.typography.headlineSmall, color = MaterialTheme.colorScheme.primary)
        Spacer(modifier = Modifier.height(24.dp))
        OutlinedTextField(
            value = username,
            onValueChange = { username = it },
            label = { Text("Identifiant patient") },
            singleLine = true,
            keyboardOptions = KeyboardOptions.Default.copy(imeAction = ImeAction.Next)
        )
        Spacer(modifier = Modifier.height(12.dp))
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next)
        )
        Spacer(modifier = Modifier.height(12.dp))
        OutlinedTextField(
            value = birthdate,
            onValueChange = { birthdate = it },
            label = { Text("Date de naissance (YYYY-MM-DD)") },
            singleLine = true,
            keyboardOptions = KeyboardOptions.Default.copy(imeAction = ImeAction.Next)
        )
        Spacer(modifier = Modifier.height(12.dp))
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Mot de passe") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
            visualTransformation = PasswordVisualTransformation()
        )
        Spacer(modifier = Modifier.height(18.dp))
        Button(
            onClick = {
                loading = true
                CoroutineScope(Dispatchers.IO).launch {
                    val client = OkHttpClient()
                    val json = JSONObject().apply {
                        put("username", username)
                        put("email", email)
                        put("birthdate", birthdate)
                        put("password", password)
                    }
                    val body = json.toString().toRequestBody("application/json".toMediaTypeOrNull())
                    val request = Request.Builder()
                        .url("http://<VOTRE_IP>:3000/api/register")
                        .post(body)
                        .build()
                    try {
                        val response = client.newCall(request).execute()
                        val respStr = response.body?.string()
                        val respJson = JSONObject(respStr ?: "")
                        loading = false
                        if (respJson.optBoolean("success")) {
                            CoroutineScope(Dispatchers.Main).launch {
                                Toast.makeText(context, "Compte créé !", Toast.LENGTH_LONG).show()
                                onRegisterSuccess(respJson.optString("genidocId"))
                            }
                        } else {
                            CoroutineScope(Dispatchers.Main).launch {
                                Toast.makeText(context, respJson.optString("message", "Erreur lors de la création du compte"), Toast.LENGTH_LONG).show()
                            }
                        }
                    } catch (e: Exception) {
                        loading = false
                        CoroutineScope(Dispatchers.Main).launch {
                            Toast.makeText(context, "Erreur réseau", Toast.LENGTH_LONG).show()
                        }
                    }
                }
            },
            enabled = !loading,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(if (loading) "Création..." else "Créer le compte")
        }
        Spacer(modifier = Modifier.height(16.dp))
        TextButton(onClick = { onBack() }) {
            Text("Déjà inscrit ? Se connecter", color = MaterialTheme.colorScheme.primary)
        }
    }
}
