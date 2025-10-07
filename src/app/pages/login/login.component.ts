import { Component, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiClientService } from '../../core/services/api-client.service';

interface LoginResponse {
  token?: string;
  error?: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'] 
})
export class LoginComponent {
  loginForm: ReturnType<FormBuilder['group']>;
  errorMessage = signal<string | null>(null);

  constructor(private fb: FormBuilder, private api: ApiClientService, private router: Router) {
    this.loginForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      contrasenia: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    const { correo, contrasenia } = this.loginForm.value;

    console.log('Enviando login con:', { correo, contrasenia });

    this.api.request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, contrasenia })
    });

    setTimeout(() => {
      const val = this.api.value(); 
      console.log('Respuesta de API:', val);

      if (val?.error) {
        if (val.error.includes('HTTP 401')) {
          this.errorMessage.set('Credenciales inválidas. Por favor, verifica tu correo y contraseña.');
        } else if (val.error.includes('HTTP 400')) {
          this.errorMessage.set('Solicitud incorrecta. Por favor, verifica el formato de tus datos.');
        } else {
          this.errorMessage.set('Ocurrió un error inesperado. Inténtalo de nuevo más tarde.');
        }
      } else if (val?.token) {
        this.errorMessage.set(null);
        console.log('Login exitoso, token:', val.token);
        this.router.navigate(['/dashboard']); 
      }
    }, 500);
  }

  get correo() {
    return this.loginForm.get('correo');
  }

  get contrasenia() {
    return this.loginForm.get('contrasenia');
  }

  get status() {
    return this.api.value;
  }
}
