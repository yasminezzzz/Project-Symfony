<?php

namespace App\Controller\Api;

use App\Entity\Course;
use App\Repository\CourseRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/courses')]
class CourseController extends AbstractController
{
    #[Route('/', name: 'api_courses_list', methods: ['GET'])]
    public function list(CourseRepository $repo): JsonResponse
    {
        $courses = $repo->findAll();

        $data = array_map(fn($c) => [
            'id' => $c->getId(),
            'title' => $c->getTitle(),
            'type' => $c->getType(),
            'group' => $c->getGroup()->getName(),
            'filePath' => $c->getFilePath(),
            'createdAt' => $c->getCreatedAt()->format('Y-m-d H:i:s'),
        ], $courses);

        return $this->json($data);
    }

    #[Route('/new', name: 'api_course_new', methods: ['POST'])]
    public function new(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $course = new Course();
        $course->setTitle($data['title'] ?? '');
        $course->setType($data['type'] ?? '');
        $course->setFilePath($data['filePath'] ?? '');
        $course->setCreatedAt(new \DateTimeImmutable());

        // Set the group
        $group = $em->getRepository('App\Entity\StudentGroup')->find($data['groupId'] ?? 0);
        if (!$group) return $this->json(['error' => 'Group not found'], 404);
        $course->setGroup($group);

        $em->persist($course);
        $em->flush();

        return $this->json(['message' => 'Course created', 'id' => $course->getId()]);
    }

    #[Route('/edit/{id}', name: 'api_course_edit', methods: ['PUT'])]
    public function edit(Request $request, Course $course, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $course->setTitle($data['title'] ?? $course->getTitle());
        $course->setType($data['type'] ?? $course->getType());
        $course->setFilePath($data['filePath'] ?? $course->getFilePath());

        // Update group if provided
        if (!empty($data['groupId'])) {
            $group = $em->getRepository('App\Entity\StudentGroup')->find($data['groupId']);
            if (!$group) return $this->json(['error' => 'Group not found'], 404);
            $course->setGroup($group);
        }

        $em->flush();
        return $this->json(['message' => 'Course updated']);
    }

    #[Route('/delete/{id}', name: 'api_course_delete', methods: ['DELETE'])]
    public function delete(Course $course, EntityManagerInterface $em): JsonResponse
    {
        $em->remove($course);
        $em->flush();

        return $this->json(['message' => 'Course deleted']);
    }
}
